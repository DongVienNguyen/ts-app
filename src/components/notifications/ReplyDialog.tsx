import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Notification } from "@/hooks/useNotifications" // Now correctly imported
import { useState } from "react"

interface ReplyDialogProps {
  notification: Notification | null
  isOpen: boolean
  onClose: () => void
  onSendReply: (notificationId: string, replyText: string, replyType: 'sender' | 'all') => void // Renamed from onReply
  onQuickAction: (notificationId: string, action: string) => void // Added
  isReplying: boolean // Added
  isQuickActioning: boolean // Added
}

export const ReplyDialog = ({ 
  notification, 
  isOpen, 
  onClose, 
  onSendReply, // Renamed
  onQuickAction, // Added
  isReplying, // Added
  isQuickActioning // Added
}: ReplyDialogProps) => {
  const [replyText, setReplyText] = useState("")

  if (!notification) return null

  const handleSendReplyClick = () => { // Renamed function
    if (replyText.trim() && notification) {
      onSendReply(notification.id, replyText, 'sender') // Default to 'sender'
      setReplyText("")
      onClose()
    }
  }

  const handleQuickActionClick = (action: string) => {
    if (notification) {
      onQuickAction(notification.id, action);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phản hồi thông báo</DialogTitle>
          <DialogDescription>
            Soạn và gửi phản hồi cho thông báo: "{notification.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">Nội dung gốc:</p>
          <div className="p-2 bg-secondary rounded text-sm mb-4">
            {notification.message}
          </div>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập phản hồi của bạn..."
            rows={4}
            disabled={isReplying || isQuickActioning}
          />
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleQuickActionClick('processed')} 
              disabled={isReplying || isQuickActioning}
            >
              {isQuickActioning ? 'Đang xử lý...' : '✅ Đã xử lý xong'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleQuickActionClick('acknowledged')} 
              disabled={isReplying || isQuickActioning}
            >
              {isQuickActioning ? 'Đang gửi...' : '👍 Đã biết'}
            </Button>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isReplying || isQuickActioning}>
                Hủy
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleSendReplyClick} 
              disabled={!replyText.trim() || isReplying || isQuickActioning}
            >
              {isReplying ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}