// shake_widget.dart — Exercise 3: Custom RenderObject shake animation.
//
// Goal:
//   Understand RenderBox layout protocol (performLayout / paint) by
//   implementing a shake animation that operates directly on the
//   paint phase — no AnimationController, no Transform widget.
//
// Why this matters:
//   Most Flutter devs never touch the render tree.  This exercise
//   reveals that widgets are just configuration; RenderObjects do
//   the actual layout & painting.  By skipping the animation
//   framework we see exactly where and how pixels move.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/scheduler.dart';

/// A widget that shakes its child when triggered via [ShakeWidget.shake].
///
/// Unlike the typical approach (AnimationController + Transform),
/// [ShakeWidget] manipulates the paint offset directly inside a
/// custom [RenderObject].  This demonstrates that animation can
/// happen at any layer of the framework.
///
/// {@tool snippet}
/// ```dart
/// ShakeWidget(
///   duration: Duration(milliseconds: 500),
///   amplitude: 10.0,
///   child: MyCard(),
/// )
/// ```
/// Trigger: `ShakeWidget.shake(context)`
/// {@end-tool}
class ShakeWidget extends SingleChildRenderObjectWidget {
  /// Duration of the shake animation.
  final Duration duration;

  /// Maximum horizontal displacement in logical pixels.
  final double amplitude;

  const ShakeWidget({
    super.key,
    required super.child,
    this.duration = const Duration(milliseconds: 400),
    this.amplitude = 10.0,
  });

  @override
  RenderShake createRenderObject(BuildContext context) {
    return RenderShake(duration: duration, amplitude: amplitude);
  }

  @override
  void updateRenderObject(BuildContext context, RenderShake renderObject) {
    renderObject
      ..duration = duration
      ..amplitude = amplitude;
  }

  /// Programmatically trigger the shake animation.
  ///
  /// [context] can be any [BuildContext] inside the [ShakeWidget]
  /// subtree.  The canonical way is to use a [GlobalKey]:
  ///
  /// ```dart
  /// final _key = GlobalKey();
  /// ...
  /// ShakeWidget(key: _key, child: ...)
  /// ShakeWidget.shake(_key.currentContext!);
  /// ```
  static void shake(BuildContext context) {
    final renderObject = context.findRenderObject() as RenderShake?;
    renderObject?.startShake();
  }
}

/// The [RenderBox] that powers [ShakeWidget].
///
/// Layout delegation:
///   ┌─────────────────────────────────────┐
///   │  performLayout()                    │
///   │    child.layout(constraints)        │
///   │    size = child.size                │
///   └─────────────────────────────────────┘
///
/// Paint mutation:
///   ┌─────────────────────────────────────┐
///   │  paint()                            │
///   │    if shaking → offset = sin(t)     │
///   │    context.paintChild(child, offset)│
///   └─────────────────────────────────────┘
class RenderShake extends RenderBox with RenderObjectWithChildMixin<RenderBox> {
  Duration duration;
  double amplitude;

  RenderShake({required this.duration, required this.amplitude});

  // ── Shake state ──────────────────────────────────────────────

  bool _isShaking = false;
  Duration? _startTime; // relative to the scheduler clock

  /// Kick off the shake animation.
  void startShake() {
    _isShaking = true;
    _startTime = null; // reset so the first paint records the baseline
    markNeedsPaint();
    SchedulerBinding.instance.scheduleFrame();
  }

  // ── Layout ──────────────────────────────────────────────────

  @override
  void performLayout() {
    if (child == null) return;
    child!.layout(constraints, parentUsesSize: true);
    size = child!.size;
  }

  // ── Painting (where the magic happens) ───────────────────────

  @override
  void paint(PaintingContext context, Offset offset) {
    if (child == null) return;

    if (!_isShaking) {
      context.paintChild(child!, offset);
      return;
    }

    final now = SchedulerBinding.instance.currentFrameTimeStamp;
    _startTime ??= now;
    final elapsed = now - _startTime!;

    if (elapsed >= duration) {
      // Animation finished — paint normally and stop.
      _isShaking = false;
      context.paintChild(child!, offset);
      return;
    }

    // Compute a damped sine-wave offset.
    //
    //   progress  : 0.0 → 1.0
    //   amplitude : amplitude * (1.0 - progress)  ← linear damping
    //   frequency : 4 complete oscillations
    //
    final progress = elapsed.inMicroseconds / duration.inMicroseconds;
    final dampedAmp = amplitude * (1.0 - progress);
    final displacementX = dampedAmp * math.sin(2 * math.pi * 4 * progress);

    context.paintChild(child!, offset + Offset(displacementX, 0));

    // Request another frame to continue the animation.
    SchedulerBinding.instance.scheduleFrame();
  }

  // ── Hit testing ──────────────────────────────────────────────

  @override
  bool hitTest(BoxHitTestResult result, {required Offset position}) {
    if (child == null) return false;
    return child!.hitTest(result, position: position);
  }
}

// ─── Visual demo page (used by exercises_main.dart) ───────────────

class ShakeWidgetDemoPage extends StatefulWidget {
  const ShakeWidgetDemoPage({super.key});

  @override
  State<ShakeWidgetDemoPage> createState() => _ShakeWidgetDemoPageState();
}

class _ShakeWidgetDemoPageState extends State<ShakeWidgetDemoPage> {
  final _shakeKey = GlobalKey();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Exercise 3: ShakeWidget')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ShakeWidget(
              key: _shakeKey,
              duration: const Duration(milliseconds: 500),
              amplitude: 12.0,
              child: Container(
                width: 200,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Text(
                  'SHAKE ME',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                final ctx = _shakeKey.currentContext;
                if (ctx != null) ShakeWidget.shake(ctx);
              },
              child: const Text('Trigger Shake'),
            ),
          ],
        ),
      ),
    );
  }
}
