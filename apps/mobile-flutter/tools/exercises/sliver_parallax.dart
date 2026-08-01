// sliver_parallax.dart — Exercise 5: Collapsible parallax header via Slivers.
//
// Goal:
//   Understand the Sliver protocol and SliverPersistentHeaderDelegate
//   by implementing an iOS Settings-style collapsible header with a
//   parallax background effect.
//
// How it works:
//   1. A [CustomScrollView] contains a [SliverPersistentHeader] at the
//      top, delegating to [SliverParallaxHeader].
//   2. As the user scrolls down (collapsing the header):
//      - The background gradient translates at half speed (parallax).
//      - The title text fades out linearly.
//   3. As the user scrolls up (expanding the header), the effect
//      reverses smoothly.
//
// Key insight:
//   SliverPersistentHeaderDelegate's [build] receives [shrinkOffset] —
//   the amount by which the header has been scrolled out of view.  We
//   use this to drive the parallax translation and text opacity.

import 'package:flutter/material.dart';

/// A collapsible header with parallax background for use in a
/// [CustomScrollView].
///
/// The header must be placed as `SliverPersistentHeader(delegate: ...)`
/// inside a [CustomScrollView].
///
/// {@tool snippet}
/// ```dart
/// CustomScrollView(
///   slivers: [
///     SliverPersistentHeader(
///       pinned: true,
///       delegate: SliverParallaxHeader(
///         maxExtent: 200,
///         minExtent: kToolbarHeight,
///         child: const Text('My Title'),
///       ),
///     ),
///     SliverList(...),
///   ],
/// )
/// ```
/// {@end-tool}
class SliverParallaxHeader extends SliverPersistentHeaderDelegate {
  /// Maximum (fully expanded) height of the header.
  @override
  final double maxExtent;

  /// Minimum (fully collapsed) height of the header.
  @override
  final double minExtent;

  /// Widget to display as the header title overlay.
  final Widget child;

  /// Creates a collapsible parallax header delegate.
  const SliverParallaxHeader({
    required this.maxExtent,
    required this.minExtent,
    required this.child,
  });

  // ── Layout parameters ───────────────────────────────────────────

  @override
  bool shouldRebuild(covariant SliverParallaxHeader oldDelegate) {
    // Only compare layout parameters. Widget child changes are handled
    // by Flutter's element update mechanism — comparing widget identity
    // across builds is unreliable.
    return maxExtent != oldDelegate.maxExtent ||
        minExtent != oldDelegate.minExtent;
  }

  // ── Building ────────────────────────────────────────────────────

  /// Builds the header widget with parallax and fade effects.
  ///
  /// [shrinkOffset] ranges from 0 (fully expanded) to
  /// [maxExtent] - [minExtent] (fully collapsed).
  /// [overlapsContent] is true when the header overlaps the scrollable
  /// content below.
  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final maxShrink = maxExtent - minExtent;
    final progress = (shrinkOffset / maxShrink).clamp(0.0, 1.0);

    // Parallax: background translates upward at 40% of scroll speed.
    // This creates the illusion of depth — the background appears
    // further away than the foreground content.
    final parallaxOffset = shrinkOffset * 0.4;

    return Stack(
      fit: StackFit.expand,
      children: [
        // ── Parallax background layer ──
        Positioned(
          top: -parallaxOffset,
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF8FC322), // Primary green
                  Color(0xFF2D5016), // Dark green
                  Color(0xFF0F0F0F), // App dark background
                ],
                stops: [0.0, 0.5, 1.0],
              ),
            ),
          ),
        ),
        // ── Title overlay (fades out as header collapses) ──
        Opacity(
          opacity: 1.0 - progress,
          child: Center(child: child),
        ),
      ],
    );
  }
}

// ─── Visual demo page (used by exercises_main.dart) ───────────────

/// Demo page for SliverParallaxHeader.
///
/// A [CustomScrollView] with the parallax header followed by 30 list
/// tiles for demonstration.
class SliverParallaxDemoPage extends StatelessWidget {
  const SliverParallaxDemoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverPersistentHeader(
            pinned: true,
            delegate: const SliverParallaxHeader(
              maxExtent: 220,
              minExtent: kToolbarHeight,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, size: 48, color: Colors.white),
                  SizedBox(height: 8),
                  Text(
                    'Iron Vault',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'BLE Hardware Wallet',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.green.shade700,
                  child: Text('${index + 1}'),
                ),
                title: Text('Account ${index + 1}'),
                subtitle: Text('0x${index.toRadixString(16).padLeft(4, '0')}...'),
                trailing: const Icon(Icons.chevron_right),
              ),
              childCount: 30,
            ),
          ),
        ],
      ),
    );
  }
}
