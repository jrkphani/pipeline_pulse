import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Keyboard, Command, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

interface KeyboardShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutSection {
  title: string
  description: string
  shortcuts: Array<{
    keys: string[]
    description: string
    context?: string
  }>
}

const shortcutSections: ShortcutSection[] = [
  {
    title: 'Navigation',
    description: 'Navigate quickly between pages and sections',
    shortcuts: [
      {
        keys: ['⌘', 'K'],
        description: 'Open command palette',
        context: 'Global'
      },
      {
        keys: ['Ctrl', 'K'],
        description: 'Open command palette (Windows/Linux)',
        context: 'Global'
      },
      {
        keys: ['Alt', '1'],
        description: 'Go to Dashboard',
        context: 'Global'
      },
      {
        keys: ['Alt', '2'],
        description: 'Go to CRM Sync',
        context: 'Global'
      },
      {
        keys: ['Alt', '3'],
        description: 'Go to CRM Sync',
        context: 'Global'
      },
      {
        keys: ['Alt', '4'],
        description: 'Go to O2R Tracker',
        context: 'Global'
      },
      {
        keys: ['Alt', '5'],
        description: 'Go to Live Sync Control',
        context: 'Global'
      },
      {
        keys: ['/'],
        description: 'Quick search / focus search input',
        context: 'Global'
      }
    ]
  },
  {
    title: 'Data Actions',
    description: 'Perform common data operations',
    shortcuts: [
      {
        keys: ['⌘', 'Shift', 'R'],
        description: 'Refresh data',
        context: 'Global'
      },
      {
        keys: ['Ctrl', 'Shift', 'R'],
        description: 'Refresh data (Windows/Linux)',
        context: 'Global'
      },
      {
        keys: ['⌘', 'S'],
        description: 'Save current changes',
        context: 'Forms'
      },
      {
        keys: ['Ctrl', 'S'],
        description: 'Save current changes (Windows/Linux)',
        context: 'Forms'
      }
    ]
  },
  {
    title: 'Interface',
    description: 'Control the application interface',
    shortcuts: [
      {
        keys: ['⌘', 'D'],
        description: 'Toggle dark mode',
        context: 'Global'
      },
      {
        keys: ['Ctrl', 'D'],
        description: 'Toggle dark mode (Windows/Linux)',
        context: 'Global'
      },
      {
        keys: ['Escape'],
        description: 'Close modal/dialog',
        context: 'Modals'
      },
      {
        keys: ['?'],
        description: 'Show keyboard shortcuts',
        context: 'Global'
      },
      {
        keys: ['⌘', 'H'],
        description: 'Show help',
        context: 'Global'
      }
    ]
  },
  {
    title: 'Tables & Lists',
    description: 'Navigate and interact with data tables',
    shortcuts: [
      {
        keys: ['↑', '↓'],
        description: 'Navigate rows',
        context: 'Tables'
      },
      {
        keys: ['←', '→'],
        description: 'Navigate columns',
        context: 'Tables'
      },
      {
        keys: ['Enter'],
        description: 'Select/edit item',
        context: 'Tables'
      },
      {
        keys: ['Space'],
        description: 'Select row',
        context: 'Tables'
      },
      {
        keys: ['Home'],
        description: 'Go to first item',
        context: 'Lists'
      },
      {
        keys: ['End'],
        description: 'Go to last item',
        context: 'Lists'
      },
      {
        keys: ['Page Up'],
        description: 'Page up',
        context: 'Tables'
      },
      {
        keys: ['Page Down'],
        description: 'Page down',
        context: 'Tables'
      }
    ]
  },
  {
    title: 'Command Palette',
    description: 'Navigate the command palette efficiently',
    shortcuts: [
      {
        keys: ['↑', '↓'],
        description: 'Navigate options',
        context: 'Command Palette'
      },
      {
        keys: ['Enter'],
        description: 'Select option',
        context: 'Command Palette'
      },
      {
        keys: ['Escape'],
        description: 'Close palette',
        context: 'Command Palette'
      },
      {
        keys: ['Tab'],
        description: 'Autocomplete',
        context: 'Command Palette'
      }
    ]
  }
]

const KeyIcon: React.FC<{ keyName: string }> = ({ keyName }) => {
  const getKeyDisplay = (key: string) => {
    switch (key) {
      case '⌘':
      case 'Cmd':
        return <Command className="h-3 w-3" />
      case '↑':
        return <ArrowUp className="h-3 w-3" />
      case '↓':
        return <ArrowDown className="h-3 w-3" />
      case '←':
        return <ArrowLeft className="h-3 w-3" />
      case '→':
        return <ArrowRight className="h-3 w-3" />
      default:
        return key
    }
  }

  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium text-muted-foreground bg-muted border border-border rounded">
      {getKeyDisplay(keyName)}
    </kbd>
  )
}

const ShortcutRow: React.FC<{ keys: string[]; description: string; context?: string }> = ({
  keys,
  description,
  context
}) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
    <div className="flex-1">
      <div className="text-sm font-medium text-foreground">{description}</div>
      {context && (
        <Badge variant="secondary" className="text-xs mt-1">
          {context}
        </Badge>
      )}
    </div>
    <div className="flex items-center space-x-1 ml-4">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="text-muted-foreground text-xs">+</span>}
          <KeyIcon keyName={key} />
        </React.Fragment>
      ))}
    </div>
  </div>
)

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate Pipeline Pulse more efficiently. 
            Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">?</kbd> anytime to view this guide.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {shortcutSections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {section.shortcuts.map((shortcut, index) => (
                    <ShortcutRow
                      key={index}
                      keys={shortcut.keys}
                      description={shortcut.description}
                      context={shortcut.context}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            These shortcuts work throughout the application unless specified otherwise.
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default KeyboardShortcutsDialog