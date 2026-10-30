begin;alter table mailbox_messages add column message_id text;alter table mailbox_messages add column reply_references text;commit;
