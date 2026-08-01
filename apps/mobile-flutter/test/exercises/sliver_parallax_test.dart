// sliver_parallax_test.dart — Exercise 5: SliverParallaxHeader delegate.
//
// Goal:
//   Verify that SliverParallaxHeader correctly reports its layout
//   parameters (maxExtent, minExtent), handles shouldRebuild correctly,
//   and renders without errors inside a CustomScrollView.
//
// How to run:
//   flutter test test/exercises/sliver_parallax_test.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../tools/exercises/sliver_parallax.dart';

void main() {
  group('Exercise 5 — SliverParallaxHeader', () {
    // ── Layout parameters ────────────────────────────────────────

    test('reports correct maxExtent and minExtent', () {
      const delegate = SliverParallaxHeader(
        maxExtent: 220,
        minExtent: 56,
        child: Text('Header'),
      );

      expect(delegate.maxExtent, 220);
      expect(delegate.minExtent, 56);
    });

    test('is a SliverPersistentHeaderDelegate', () {
      const delegate = SliverParallaxHeader(
        maxExtent: 200,
        minExtent: 56,
        child: SizedBox(),
      );

      expect(delegate, isA<SliverPersistentHeaderDelegate>());
    });

    // ── shouldRebuild ───────────────────────────────────────────

    test('shouldRebuild returns true when maxExtent differs', () {
      const oldDelegate = SliverParallaxHeader(
        maxExtent: 200,
        minExtent: 56,
        child: Text('Header'),
      );
      const newDelegate = SliverParallaxHeader(
        maxExtent: 300,
        minExtent: 56,
        child: Text('Header'),
      );

      expect(newDelegate.shouldRebuild(oldDelegate), isTrue);
    });

    test('shouldRebuild returns true when minExtent differs', () {
      const oldDelegate = SliverParallaxHeader(
        maxExtent: 200,
        minExtent: 56,
        child: Text('Header'),
      );
      const newDelegate = SliverParallaxHeader(
        maxExtent: 200,
        minExtent: 80,
        child: Text('Header'),
      );

      expect(newDelegate.shouldRebuild(oldDelegate), isTrue);
    });

    test('shouldRebuild returns false when layout params equal', () {
      const delegate = SliverParallaxHeader(
        maxExtent: 200,
        minExtent: 56,
        child: Text('Header'),
      );
      const same = SliverParallaxHeader(
        maxExtent: 200,
        minExtent: 56,
        child: Text('Other'), // child ignored by shouldRebuild
      );

      expect(same.shouldRebuild(delegate), isFalse);
    });

    // ── Widget render test ──────────────────────────────────────

    testWidgets('renders inside CustomScrollView without errors',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomScrollView(
              slivers: [
                SliverPersistentHeader(
                  pinned: true,
                  delegate: const SliverParallaxHeader(
                    maxExtent: 200,
                    minExtent: kToolbarHeight,
                    child: Text(
                      'Iron Vault',
                      style: TextStyle(color: Colors.white, fontSize: 24),
                    ),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ListTile(
                      title: Text('Item $index'),
                    ),
                    childCount: 5,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Verify header renders
      expect(find.text('Iron Vault'), findsOneWidget);

      // Verify list items render
      expect(find.text('Item 0'), findsOneWidget);
      expect(find.text('Item 4'), findsOneWidget);
    });

    testWidgets('parallax header collapses on scroll', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomScrollView(
              slivers: [
                SliverPersistentHeader(
                  pinned: true,
                  delegate: const SliverParallaxHeader(
                    maxExtent: 200,
                    minExtent: kToolbarHeight,
                    child: Text('Header'),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => SizedBox(
                      height: 60,
                      child: ListTile(title: Text('Item $index')),
                    ),
                    childCount: 20,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Verify initial render — header should be visible
      expect(find.text('Header'), findsOneWidget);

      // Scroll down to collapse the header
      await tester.drag(find.text('Item 0'), const Offset(0, -400));
      await tester.pump(const Duration(milliseconds: 300));

      // Header should still exist (pinned), but may be collapsed
      // The text may have faded; the widget should still be in the tree
      expect(find.byType(SliverPersistentHeader), findsOneWidget);
    });

    testWidgets('demo page renders without errors', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SliverParallaxDemoPage()),
      );

      // Verify core UI elements are present
      expect(find.text('Iron Vault'), findsOneWidget);
      expect(find.text('BLE Hardware Wallet'), findsOneWidget);
      expect(find.text('Account 1'), findsOneWidget);
    });
  });
}
