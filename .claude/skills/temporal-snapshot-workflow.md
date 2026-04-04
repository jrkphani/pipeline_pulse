# Temporal Intelligence — Pipeline Pulse Patterns

> The temporal snapshot system captures point-in-time pipeline state for trend analysis,
> forecast accuracy tracking, and historical pipeline review.
> This is the "time-series engine" referenced in BRD v6.1.

---

## Core Concepts

**`temporal_snapshot`** — A frozen record of an opportunity's key metrics at a point in time.
- Created: on schedule (weekly), on significant changes (stage transition, SGD core delta > 10%), on user request
- Never mutated after creation — append-only
- Used for: pipeline velocity charts, win rate analysis, SGD core trend lines

**`relay_leg`** — One custodian's ownership window within an opportunity lifecycle.
- Has `started_at` and `ended_at` (null if current)
- Carries the `sgd_core_at_handoff` snapshot
- Forms the relay race: Opportunity → [RelayLeg, RelayLeg, RelayLeg...]

---

## Snapshot Creation Triggers

```python
# services/snapshot_service.py
class SnapshotService:
    SIGNIFICANT_SGD_DELTA_PCT = 0.10  # 10% change triggers snapshot

    async def maybe_create_snapshot(
        self,
        db: AsyncSession,
        opportunity: Opportunity,
        trigger: SnapshotTrigger,
    ) -> TemporalSnapshot | None:
        """Create snapshot if triggered by significant event."""
        last = await self._get_last_snapshot(db, opportunity.id)

        should_create = (
            trigger == SnapshotTrigger.SCHEDULED
            or trigger == SnapshotTrigger.STAGE_CHANGE
            or trigger == SnapshotTrigger.FORCED
            or (
                trigger == SnapshotTrigger.VALUE_CHANGE
                and last
                and self._is_significant_delta(last.sgd_core, opportunity.sgd_core)
            )
        )

        if not should_create:
            return None

        snapshot = TemporalSnapshot(
            opportunity_id=opportunity.id,
            snapshot_date=date.today(),
            sgd_core=opportunity.sgd_core,
            stage=opportunity.stage,
            custodian_id=opportunity.custodian_id,
            probability=opportunity.probability,
            trigger=trigger,
        )
        db.add(snapshot)
        await db.flush()
        return snapshot

    def _is_significant_delta(self, old: Decimal, new: Decimal) -> bool:
        if old == 0:
            return new > 0
        return abs((new - old) / old) >= self.SIGNIFICANT_SGD_DELTA_PCT
```

---

## Relay Transfer Pattern

```python
# services/relay_service.py
class RelayService:
    async def transfer_custodian(
        self,
        db: AsyncSession,
        opportunity_id: UUID,
        new_custodian_id: UUID,
        reason: str,
        transferred_by: UUID,
    ) -> Opportunity:
        """
        Transfer custodianship — the core relay race baton pass.
        Creates temporal snapshot at handoff point.
        """
        async with db.begin():
            # 1. Close the current relay leg
            current_leg = await self._get_active_leg(db, opportunity_id)
            if current_leg:
                current_leg.ended_at = datetime.utcnow()
                current_leg.sgd_core_at_handoff = opportunity.sgd_core

            # 2. Open new relay leg
            new_leg = RelayLeg(
                opportunity_id=opportunity_id,
                custodian_id=new_custodian_id,
                started_at=datetime.utcnow(),
                reason=reason,
                transferred_by=transferred_by,
            )
            db.add(new_leg)

            # 3. Update opportunity custodian
            opportunity = await self._get_opportunity(db, opportunity_id)
            opportunity.custodian_id = new_custodian_id

            # 4. Take snapshot at handoff point
            await snapshot_service.maybe_create_snapshot(
                db, opportunity, SnapshotTrigger.RELAY_HANDOFF
            )

        return opportunity
```

---

## Snapshot Query Patterns

```python
# Retrieve time-series for a single opportunity
async def get_opportunity_timeline(
    db: AsyncSession,
    opportunity_id: UUID,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[TemporalSnapshot]:
    stmt = (
        select(TemporalSnapshot)
        .where(TemporalSnapshot.opportunity_id == opportunity_id)
        .order_by(TemporalSnapshot.snapshot_date.asc())
    )
    if from_date:
        stmt = stmt.where(TemporalSnapshot.snapshot_date >= from_date)
    if to_date:
        stmt = stmt.where(TemporalSnapshot.snapshot_date <= to_date)
    result = await db.execute(stmt)
    return list(result.scalars().all())

# Pipeline value at a specific point in time (for retrospective analysis)
async def get_pipeline_at_date(
    db: AsyncSession,
    target_date: date,
    custodian_id: UUID | None = None,
) -> Decimal:
    """Returns total SGD core pipeline value as of target_date."""
    # Use the most recent snapshot at or before target_date per opportunity
    subq = (
        select(
            TemporalSnapshot.opportunity_id,
            func.max(TemporalSnapshot.snapshot_date).label('latest_date'),
        )
        .where(TemporalSnapshot.snapshot_date <= target_date)
        .group_by(TemporalSnapshot.opportunity_id)
        .subquery()
    )
    stmt = (
        select(func.sum(TemporalSnapshot.sgd_core))
        .join(subq, and_(
            TemporalSnapshot.opportunity_id == subq.c.opportunity_id,
            TemporalSnapshot.snapshot_date == subq.c.latest_date,
        ))
    )
    if custodian_id:
        stmt = stmt.where(TemporalSnapshot.custodian_id == custodian_id)

    result = await db.execute(stmt)
    return result.scalar_one() or Decimal('0')
```

---

## Frontend: Timeline Chart

```typescript
// Recharts line chart for opportunity SGD core over time
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TimelineChartProps {
  snapshots: TemporalSnapshot[];
}

export function OpportunityTimeline({ snapshots }: TimelineChartProps) {
  const data = snapshots.map((s) => ({
    date: format(parseISO(s.snapshot_date), 'dd MMM'),
    sgd_core: Number(s.sgd_core),
    stage: s.stage,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(v) => formatSGDCompact(v)} />
        <Tooltip formatter={(v: number) => [formatSGD(v), 'SGD Core']} />
        <Line
          type="monotone"
          dataKey="sgd_core"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```
