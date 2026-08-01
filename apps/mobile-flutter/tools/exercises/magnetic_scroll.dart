// magnetic_scroll.dart — Exercise 4: Custom ScrollPhysics with magnetic snap.
//
// Goal:
//   Understand the ScrollPhysics protocol by implementing a physics
//   class that snaps the scroll to the nearest item after the user
//   lifts their finger — similar to iOS's paging behavior but at
//   per-item granularity.
//
// ScrollPhysics protocol:
//   ┌─────────────────────────────────────────────────────────┐
//   │  applyTo(ancestor)  → chain physics (parent ← child)    │
//   │  applyPhysicsToUserOffset(pos, delta) → adjust drag     │
//   │  createBallisticSimulation(pos, velocity) → after-lift  │
//   │  applyBoundaryConditions(pos, value) → clamp overscroll │
//   └─────────────────────────────────────────────────────────┘
//
//   During drag:   applyPhysicsToUserOffset is called every frame.
//   On lift/flick: goBallistic → createBallisticSimulation returns
//                  a Simulation that drives the remaining motion.

import 'package:flutter/material.dart';

/// A [ScrollPhysics] subclass that snaps to the nearest item boundary.
///
/// After the user lifts their finger, the scroll position is animated to
/// the nearest item-aligned offset using a spring simulation, creating a
/// "magnetic" feel.
///
/// During active dragging, a subtle nudge (10% of the remaining distance)
/// pulls toward the nearest snap target when the user is within 20% of an
/// item's height from the aligned position.
///
/// {@tool snippet}
/// ```dart
/// ListView.builder(
///   physics: MagneticScrollPhysics(
///     itemHeight: 80.0,
///     parent: const BouncingScrollPhysics(),
///   ),
///   itemCount: 30,
///   itemBuilder: (ctx, i) => _buildItem(i),
/// )
/// ```
/// {@end-tool}
class MagneticScrollPhysics extends ScrollPhysics {
  /// Fixed height of each item in logical pixels.
  final double itemHeight;

  const MagneticScrollPhysics({
    required this.itemHeight,
    super.parent,
  });

  @override
  MagneticScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return MagneticScrollPhysics(
      itemHeight: itemHeight,
      parent: buildParent(ancestor),
    );
  }

  // ── Private helpers ─────────────────────────────────────────────

  /// Returns the nearest item-aligned offset for [offset].
  ///
  /// Items are assumed to start at multiples of [itemHeight].
  /// Non-negative offsets clamp to 0.
  double _snapTarget(double offset) {
    if (offset <= 0) return 0;
    return (offset / itemHeight).round() * itemHeight;
  }

  // ── Physics overrides ──────────────────────────────────────────

  /// Adjusts the user's drag delta.
  ///
  /// Delegates to parent physics for friction, then applies a subtle
  /// magnetic nudge (10% of the remaining distance) toward the nearest
  /// snap point when the predicted target is within 20% of [itemHeight].
  @override
  double applyPhysicsToUserOffset(ScrollMetrics position, double offset) {
    final adjusted = super.applyPhysicsToUserOffset(position, offset);
    final predictedTarget = position.pixels + adjusted;
    final snapTarget = _snapTarget(predictedTarget);
    final distance = predictedTarget - snapTarget;

    // If the predicted position is close to a snap point, nudge.
    if (distance.abs() < itemHeight * 0.2 && distance.abs() > 1.0) {
      return adjusted - distance * 0.1;
    }

    return adjusted;
  }

  /// Returns a spring simulation that snaps to the nearest item.
  ///
  /// Called when the user lifts their finger.  If the scroll is already
  /// at a snap point and velocity is negligible, returns `null` to stop
  /// immediately.  Otherwise returns a [ScrollSpringSimulation] tuned
  /// for a quick, smooth snap.
  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    final currentOffset = position.pixels;
    final snapTarget = _snapTarget(currentOffset);

    // Already at snap with low velocity → no animation needed.
    if ((currentOffset - snapTarget).abs() < 1.0 && velocity.abs() < 50) {
      return null;
    }

    // Predict where the scroll would naturally drift, then snap.
    // If velocity is toward the snap target, let spring take over.
    // If velocity is away, still snap — magnetic override wins.
    const spring = SpringDescription(
      mass: 0.5,
      stiffness: 200.0,
      damping: 18.0,
    );
    return ScrollSpringSimulation(
      spring,
      currentOffset,
      snapTarget,
      velocity,
      tolerance: const Tolerance(velocity: 0.5, distance: 0.5),
    );
  }
}

// ─── Visual demo page (used by exercises_main.dart) ───────────────

/// Demo page for MagneticScrollPhysics.
///
/// Shows a list of 30 colored items with a toggle to enable/disable
/// magnetic snapping for visual comparison.
class MagneticScrollDemoPage extends StatefulWidget {
  const MagneticScrollDemoPage({super.key});

  @override
  State<MagneticScrollDemoPage> createState() =>
      _MagneticScrollDemoPageState();
}

class _MagneticScrollDemoPageState extends State<MagneticScrollDemoPage> {
  static const double _itemHeight = 80.0;
  static const int _itemCount = 30;
  bool _magneticEnabled = true;

  static final List<Color> _colors = [
    Colors.blue,
    Colors.red,
    Colors.green,
    Colors.orange,
    Colors.purple,
    Colors.teal,
    Colors.pink,
    Colors.indigo,
    Colors.amber,
    Colors.cyan,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exercise 4: Magnetic Scroll'),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Snap', style: TextStyle(fontSize: 13)),
                  Switch(
                    value: _magneticEnabled,
                    onChanged: (v) => setState(() => _magneticEnabled = v),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return ListView.builder(
            physics: _magneticEnabled
                ? MagneticScrollPhysics(
                    itemHeight: _itemHeight,
                    parent: const BouncingScrollPhysics(),
                  )
                : const BouncingScrollPhysics(),
            itemCount: _itemCount,
            itemBuilder: (context, index) {
              final color = _colors[index % _colors.length];
              return Container(
                height: _itemHeight,
                margin: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: color.withAlpha(180),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Text(
                  'Item $index',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
