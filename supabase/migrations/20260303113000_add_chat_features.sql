-- Add read_by column to company_messages for read receipts
ALTER TABLE company_messages 
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_company_id UUID, 
  p_user_id UUID, 
  p_last_message_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update all messages in the company where the user is NOT the sender
  -- and the user is NOT already in the read_by array
  UPDATE company_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE company_id = p_company_id
    AND sender_id != p_user_id
    AND NOT (read_by @> ARRAY[p_user_id]);
END;
$$ LANGUAGE plpgsql;
