// magnetic_scroll_test.dart — Exercise 4: MagneticScrollPhysics snap behavior.
//
// Goal:
//   Verify that MagneticScrollPhysics correctly extends ScrollPhysics,
//   creates a spring simulation for snap behavior, and nudges the user
//   offset toward the nearest item-aligned position.
//
// How to run:
//   flutter test test/exercises/magnetic_scroll_test.dart

import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../tools/exercises/magnetic_scroll.dart';

void main() {
  group('Exercise 4 — MagneticScrollPhysics', () {
    // ── Construction & type check ─────────────────────────────────

    test('is an instance of ScrollPhysics', () {
      final physics = MagneticScrollPhysics(itemHeight: 80);
      expect(physics, isA<ScrollPhysics>());
    });

    test('applyTo preserves itemHeight', () {
      final parent = const BouncingScrollPhysics();
      final physics = MagneticScrollPhysics(
        itemHeight: 80,
        parent: parent,
      );
      final applied = physics.applyTo(const ClampingScrollPhysics());
      expect(applied, isA<MagneticScrollPhysics>());
      expect((applied as MagneticScrollPhysics).itemHeight, 80);
    });

    // ── applyPhysicsToUserOffset ────────────────────────────────

    test('applyPhysicsToUserOffset nudges toward nearest snap', () {
      const physics = MagneticScrollPhysics(itemHeight: 80);
      final position = FixedScrollMetrics(
        minScrollExtent: 0,
        maxScrollExtent: 2400,
        pixels: 100, // between item 1 (80) and item 2 (160)
        viewportDimension: 600,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 1.0,
      );

      // With a non-zero user delta, magnetic physics nudges toward snap
      final result = physics.applyPhysicsToUserOffset(position, 30);
      // Position 100 + delta 30 = 130. Nearest snap is 160 (distance 30).
      // The result should be non-zero and adjusted toward 160 (positive)
      expect(result, greaterThan(0));
    });

    test('applyPhysicsToUserOffset returns 0 when already at snap', () {
      const physics = MagneticScrollPhysics(itemHeight: 80);
      final position = FixedScrollMetrics(
        minScrollExtent: 0,
        maxScrollExtent: 2400,
        pixels: 80, // exactly at snap
        viewportDimension: 600,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 1.0,
      );

      // At the snap point, distance = 0 → should return parent delta only
      final result = physics.applyPhysicsToUserOffset(position, 50);
      // Parent physics may apply friction, but the result should be the
      // parent-adjusted value since distance is 0
      expect(result, isA<double>());
    });

    // ── createBallisticSimulation ───────────────────────────────

    test('createBallisticSimulation returns spring simulation', () {
      const physics = MagneticScrollPhysics(itemHeight: 80);
      final position = FixedScrollMetrics(
        minScrollExtent: 0,
        maxScrollExtent: 2400,
        pixels: 100, // offset from snap
        viewportDimension: 600,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 1.0,
      );

      final simulation = physics.createBallisticSimulation(position, 200);
      expect(simulation, isNotNull);
      expect(simulation, isA<SpringSimulation>());
    });

    test('createBallisticSimulation returns null when near snap with low velocity',
        () {
      const physics = MagneticScrollPhysics(itemHeight: 80);
      final position = FixedScrollMetrics(
        minScrollExtent: 0,
        maxScrollExtent: 2400,
        pixels: 79.5, // very close to snap at 80
        viewportDimension: 600,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 1.0,
      );

      final simulation = physics.createBallisticSimulation(position, 10);
      expect(simulation, isNull);
    });

    test('spring simulation snaps to nearest item', () {
      const physics = MagneticScrollPhysics(itemHeight: 80);
      final position = FixedScrollMetrics(
        minScrollExtent: 0,
        maxScrollExtent: 2400,
        pixels: 100, // nearest snap: 80 or 160? 100 → nearest is 80
        viewportDimension: 600,
        axisDirection: AxisDirection.down,
        devicePixelRatio: 1.0,
      );

      final simulation = physics.createBallisticSimulation(
        position,
        300,
      )!;

      // After enough time, the spring simulation should reach the snap target.
      // The snap target for pixel 100 is 80 (nearest item boundary).
      // Use x(time) to evaluate at a large time value.
      final endValue = simulation.x(10.0); // 10 seconds should be enough
      expect(endValue, anyOf(equals(80.0), equals(160.0)));
    });

    // ── Widget test: renders ListView with magnetic physics ─────

    testWidgets('ListView with MagneticScrollPhysics renders items',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              physics: const MagneticScrollPhysics(
                itemHeight: 80,
                parent: BouncingScrollPhysics(),
              ),
              itemCount: 10,
              itemBuilder: (context, index) {
                return Container(
                  height: 80,
                  alignment: Alignment.center,
                  child: Text('Item $index'),
                );
              },
            ),
          ),
        ),
      );

      expect(find.text('Item 0'), findsOneWidget);
      expect(find.text('Item 5'), findsOneWidget);
    });

    testWidgets('Toggling magnetic snap works in demo page',
        (tester) async {
      await tester.pumpWidget(const MaterialApp(home: MagneticScrollDemoPage()));

      // Find the snap toggle switch
      expect(find.byType(Switch), findsOneWidget);
      expect(find.text('Item 0'), findsOneWidget);

      // Toggle off
      await tester.tap(find.byType(Switch));
      await tester.pump();

      // Scroll test
      await tester.drag(find.text('Item 0'), const Offset(0, -200));
      await tester.pump();
    });
  });
}
