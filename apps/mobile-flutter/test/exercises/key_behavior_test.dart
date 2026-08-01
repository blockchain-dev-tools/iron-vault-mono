// key_behavior_test.dart — Exercise 2: Key 的作用与 Widget 复用。
//
// Goal:
//   对比 ValueKey / ObjectKey / UniqueKey / GlobalKey 的行为差异，
//   复现"无 key 时状态错乱"的经典场景（列表项重排导致 State 残留）。
//
// How to run:
//   flutter test test/exercises/key_behavior_test.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// ─── Test widget: a tile that tracks tap count in its State ───────
//
// Each tile's State keeps a private `_count`.  When the framework
// matches widgets to existing Elements (during the build/update
// cycle), it uses either position-in-parent or [Key] to decide.
// This test makes that decision visible.

class _CountingTile extends StatefulWidget {
  final String label;

  /// Public getter to read tap count from tests.
  int getCount(BuildContext context) {
    final state = context.findAncestorStateOfType<_CountingTileState>();
    return state?._count ?? -1;
  }

  const _CountingTile({required this.label, super.key});

  @override
  State<_CountingTile> createState() => _CountingTileState();
}

class _CountingTileState extends State<_CountingTile> {
  int _count = 0;

  /// Exposed for GlobalKey-based access in tests.
  int get count => _count;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      key: ValueKey('btn_${widget.label}'),
      onPressed: () => setState(() => _count++),
      child: Text('${widget.label}: $_count'),
    );
  }
}

/// Helper: builds a [MaterialApp] wrapping a [Column] of tiles.
Widget buildApp(List<_CountingTile> tiles) {
  return MaterialApp(
    home: Scaffold(
      body: Column(children: tiles),
    ),
  );
}

// ─── Tests ────────────────────────────────────────────────────────

void main() {
  group('Exercise 2 — Key Behavior', () {
    // ── Scenario A: No keys → state bound to position ──────────
    //
    // When a Column rebuilds with items in a different order,
    // Flutter matches each child widget to the Element at its
    // **position** (index).  Without a key, the State object
    // from the old item at index N is reused for the *new* item
    // at index N — even if it represents different data.
    //
    // Layout before:
    //   index 0: "Red"   (State A, count=0)
    //   index 1: "Green" (State B, count=0)
    //   index 2: "Blue"  (State C, count=0)
    //
    // Tap "Green" (index 1) → State B.count = 1
    //
    // After swap (no keys):
    //   index 0: "Red"   (State A, count=0)  ← same, OK
    //   index 1: "Blue"  (State B, count=1)  ← WRONG! "Blue" inherits Green's old state
    //   index 2: "Green" (State C, count=0)  ← WRONG! "Green" inherits Blue's old state

    testWidgets('No key: state is tied to position, not identity', (tester) async {
      await tester.pumpWidget(buildApp([
        const _CountingTile(label: 'Red'),
        const _CountingTile(label: 'Green'),
        const _CountingTile(label: 'Blue'),
      ]));

      // Verify initial state.
      expect(find.text('Red: 0'), findsOneWidget);
      expect(find.text('Green: 0'), findsOneWidget);
      expect(find.text('Blue: 0'), findsOneWidget);

      // Tap "Green" → its count becomes 1.
      await tester.tap(find.text('Green: 0'));
      await tester.pump();
      expect(find.text('Green: 1'), findsOneWidget);

      // Rebuild with items reordered — NO KEYS.
      await tester.pumpWidget(buildApp([
        const _CountingTile(label: 'Red'),
        const _CountingTile(label: 'Blue'),   // was index 2, now index 1
        const _CountingTile(label: 'Green'),  // was index 1, now index 2
      ]));

      // Position 1 used to be "Green" (count=1); now it's "Blue",
      // but the State at position 1 still has count=1 (Green's old state).
      expect(find.text('Blue: 1'), findsOneWidget,
          reason: 'Blue at index 1 inherited Green\'s old state (count=1)');

      // Position 2 used to be "Blue" (count=0); now it's "Green",
      // but the State at position 2 still has count=0 (Blue's old state).
      expect(find.text('Green: 0'), findsOneWidget,
          reason: 'Green at index 2 inherited Blue\'s old state (count=0)');
    });

    // ── Scenario B: ValueKey → state follows identity ─────────
    //
    // With a [ValueKey] that encodes the item's data identity,
    // Flutter can match old State to new widget by key, not by
    // position.  After reordering, each item keeps its State.

    testWidgets('ValueKey: state follows item identity', (tester) async {
      await tester.pumpWidget(buildApp([
        const _CountingTile(label: 'Red', key: ValueKey('Red')),
        const _CountingTile(label: 'Green', key: ValueKey('Green')),
        const _CountingTile(label: 'Blue', key: ValueKey('Blue')),
      ]));

      await tester.tap(find.text('Green: 0'));
      await tester.pump();
      expect(find.text('Green: 1'), findsOneWidget);

      // Reorder with ValueKeys.
      await tester.pumpWidget(buildApp([
        const _CountingTile(label: 'Red', key: ValueKey('Red')),
        const _CountingTile(label: 'Blue', key: ValueKey('Blue')),
        const _CountingTile(label: 'Green', key: ValueKey('Green')),
      ]));

      // Green keeps its state (count=1) at new position.
      expect(find.text('Green: 1'), findsOneWidget);
      // Blue at position 1 keeps its own initial state (count=0).
      expect(find.text('Blue: 0'), findsOneWidget);
    });

    // ── Scenario C: ObjectKey (same as ValueKey for this case) ─

    testWidgets('ObjectKey: uses object identity for matching', (tester) async {
      await tester.pumpWidget(buildApp([
        const _CountingTile(label: 'A', key: ObjectKey('A')),
        const _CountingTile(label: 'B', key: ObjectKey('B')),
      ]));

      await tester.tap(find.text('B: 0'));
      await tester.pump();
      expect(find.text('B: 1'), findsOneWidget);

      // ObjectKey('B') == ObjectKey('B') → same key in Dart
      // because strings have canonical equality.
      await tester.pumpWidget(buildApp([
        const _CountingTile(label: 'A', key: ObjectKey('A')),
        const _CountingTile(label: 'B', key: ObjectKey('B')),
      ]));
      expect(find.text('B: 1'), findsOneWidget);
    });

    // ── Scenario D: UniqueKey → always fresh State ────────────
    //
    // Every time a [UniqueKey] is created it is a new identity,
    // so Flutter always unmounts the old Element and creates a
    // fresh one — losing all previous state.

    testWidgets('UniqueKey: always creates a new Element (state reset)', (tester) async {
      await tester.pumpWidget(buildApp([
            _CountingTile(label: 'X', key: UniqueKey()),
          ]));

      await tester.tap(find.text('X: 0'));
      await tester.pump();
      expect(find.text('X: 1'), findsOneWidget);

      // Rebuild with a *new* UniqueKey — state is lost.
      await tester.pumpWidget(buildApp([
            _CountingTile(label: 'X', key: UniqueKey()),
          ]));

      expect(find.text('X: 0'), findsOneWidget,
          reason: 'New UniqueKey → new Element → state reset to 0');
    });

    // ── Scenario E: GlobalKey — cross-tree state access ───────
    //
    // [GlobalKey] uniquely identifies an Element across the entire
    // app and allows external code to reach into the State object.

    testWidgets('GlobalKey: allows accessing State from outside the widget tree',
        (tester) async {
      final globalKey = GlobalKey<_CountingTileState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: _CountingTile(label: 'Global', key: globalKey),
          ),
        ),
      );

      // Tap via the UI.
      await tester.tap(find.text('Global: 0'));
      await tester.pump();
      expect(find.text('Global: 1'), findsOneWidget);

      // Directly mutate state through the GlobalKey outside the build.
      // GlobalKey.currentState gives access to the State object from anywhere.
      final state = globalKey.currentState!;
      state._count = 42; // ignore: invalid_use_of_protected_member
      state.setState(() {}); // Trigger rebuild after external mutation
      await tester.pump();

      // The widget reflects the externally-mutated value.
      expect(find.text('Global: 42'), findsOneWidget,
          reason: 'GlobalKey provides direct access to State for external mutation');
    });
  });
}
