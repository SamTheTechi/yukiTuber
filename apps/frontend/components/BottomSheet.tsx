import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/colors'

interface SheetProp {
  bottomSheetRef: React.Ref<BottomSheet>;
  children: React.ReactNode,
  snapPoints?: string,
  onClose?: () => void,
}


export const Sheet = ({ bottomSheetRef, children, snapPoints = '60', onClose }: SheetProp) => {


  const colorScheme = useColorScheme();

  const textColor: any = Colors[colorScheme ?? 'light'].text;
  const tintColor: any = Colors[colorScheme ?? 'light'].tint;
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  const handleSheetChanges = (index: number) => {
    if (index === -1 && onClose) {
      onClose()
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[`${snapPoints}%`]}
      enablePanDownToClose={true}
      handleIndicatorStyle={{
        backgroundColor: tintColor,
      }}
      onChange={handleSheetChanges}
      backgroundStyle={{
        backgroundColor,
        shadowColor: textColor,
        shadowOffset: { width: 0, height: -16 },
        shadowOpacity: 1.0,
        shadowRadius: 12,
        elevation: 24,
      }}

    >
      <BottomSheetView
        style={{
          flex: 1,
          alignItems: 'center'
        }}>
        {children}
      </BottomSheetView>
    </BottomSheet >
  );
};




