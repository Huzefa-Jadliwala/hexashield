import { useParams } from 'react-router-dom';

export default function ConversationDetailsPage() {
  const params = useParams<{ conversationId: string }>();
  return (
    <div>
      <h1>Chat Page {params.conversationId}</h1>
    </div>
  );
}
