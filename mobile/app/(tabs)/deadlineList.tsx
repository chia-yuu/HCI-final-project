import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';

export default function DeadlineListScreen() {
  return (
    <PageTemplate title="任務清單" selectedTab="deadline">
      <ThemedText type='default'>這一頁是任務清單</ThemedText>
    </PageTemplate>
  );
}
