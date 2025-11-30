import PageTemplate from '@/components/page-template';
import { ThemedText } from '@/components/themed-text';

export default function FocusModeScreen() {
  return (
    <PageTemplate title="專注模式" selectedTab="focus">
      <ThemedText type='default'>這一頁是專注模式</ThemedText>
    </PageTemplate>
  );
}
