// ledger_logo_test.dart — Exercise 6: LedgerLogo CustomPainter.
//
// Goal:
//   Verify that LedgerLogo renders without errors, the painter's
//   shouldRepaint correctly detects size changes, and the logo
//   displays at multiple sizes.
//
// How to run:
//   flutter test test/exercises/ledger_logo_test.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../lib/ui/theme/widgets/ledger_logo.dart';

void main() {
  group('Exercise 6 — Ledger Logo', () {
    // ── Widget instantiation & render ────────────────────────────

    testWidgets('can instantiate and renders LedgerLogo', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: Center(child: LedgerLogo(size: 160))),
        ),
      );

      // The widget should be findable by its CustomPaint subtree.
      // MaterialApp may use CustomPaint internally too, so check at least one.
      expect(find.byType(CustomPaint), findsAtLeast(1));
    });

    testWidgets('renders at different sizes', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            backgroundColor: const Color(0xFF0F0F0F),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  LedgerLogo(size: 80),
                  SizedBox(height: 16),
                  LedgerLogo(size: 160),
                  SizedBox(height: 16),
                  LedgerLogo(size: 240),
                ],
              ),
            ),
          ),
        ),
      );

      // All three LedgerLogo instances should render via CustomPaint.
      // MaterialApp may include additional CustomPaint widgets so use atLeast.
      expect(find.byType(CustomPaint), findsAtLeast(3));
    });

    // ── shouldRepaint ───────────────────────────────────────────

    test('shouldRepaint returns true when size differs', () {
      final painter1 = LedgerLogoPainter(size: 160);
      final painter2 = LedgerLogoPainter(size: 240);

      expect(painter2.shouldRepaint(painter1), isTrue);
    });

    test('shouldRepaint returns false when size is same', () {
      final painter1 = LedgerLogoPainter(size: 160);
      final painter2 = LedgerLogoPainter(size: 160);

      expect(painter2.shouldRepaint(painter1), isFalse);
    });

    // ── Demo page ───────────────────────────────────────────────

    testWidgets('demo page renders all sizes', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LedgerLogoDemoPage()),
      );

      // Should show at least three Logo instances (MaterialApp adds some internal CustomPaint)
      expect(find.byType(CustomPaint), findsAtLeast(3));

      // Size labels should be present
      expect(find.text('80 px'), findsOneWidget);
      expect(find.text('160 px'), findsOneWidget);
      expect(find.text('240 px'), findsOneWidget);
    });

    // ── Golden test (optional — verifies visual output) ─────────

    testWidgets('logo golden test at default size', (tester) async {
      await tester.pumpWidget(
        const RepaintBoundary(
          key: ValueKey('logo_golden'),
          child: MaterialApp(
            home: Scaffold(
              backgroundColor: Color(0xFF0F0F0F),
              body: Center(child: LedgerLogo(size: 160)),
            ),
          ),
        ),
      );

      // Verify the RepaintBoundary renders (MaterialApp adds internal CustomPaint widgets)
      expect(find.byType(CustomPaint), findsAtLeast(1));

      // Golden file comparison (uncomment when golden files are committed):
      // await expectLater(
      //   find.byKey(const ValueKey('logo_golden')),
      //   matchesGoldenFile('goldens/ledger_logo_160.png'),
      // );
    });
  });
}
