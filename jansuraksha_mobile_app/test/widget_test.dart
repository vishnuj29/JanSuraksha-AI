import 'package:flutter_test/flutter_test.dart';
import 'package:jansuraksha_mobile_app/main.dart';

void main() {
  testWidgets('App loads splash screen successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const JanSurakshaMobileApp());
    expect(find.text('JanSuraksha AI'), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 3000));
    await tester.pumpAndSettle();
  });
}

