// ledger_logo.dart — Exercise 6: Ledger-inspired logo drawn with CustomPainter.
//
// Goal:
//   Master the Canvas API by drawing a branded logo entirely in code —
//   no assets, no images.  This widget will be reused across the app
//   (Welcome screen, Unlock screen, etc.).
//
// Why this matters:
//   CustomPaint + Canvas gives pixel-level control.  For a hardware
//   wallet app, a distinctive vector logo drawn on the GPU is lighter
//   and crisper than bitmaps at any resolution.
//
// Canvas primitives used:
//   - Path.moveTo / Path.lineTo / Path.close    → hexagon outline
//   - canvas.drawPath                              → stroked/filled path
//   - canvas.drawLine                              → circuit traces
//   - canvas.drawCircle                            → contact pads
//   - TextPainter.layout / .paint                  → "IV" text

import 'dart:math' as math;

import 'package:flutter/material.dart';

// ─── Constants ────────────────────────────────────────────────────

/// Primary brand color (matching iron-vault theme).
const Color _primaryGreen = Color(0xFF8FC322);

/// Dark chip color for circuit pattern fill.
const Color _chipDark = Color(0xFF1A3A0A);

/// Lighter trace color for circuit lines.
const Color _traceGreen = Color(0xFFA8D84B);

// ─── Widget ──────────────────────────────────────────────────────

/// A hexagon-shaped logo with chip/circuit patterns and "IV" text.
///
/// Draws a rounded hexagon outline in the app's primary green, with
/// inner concentric geometric lines simulating a chip pattern, and
/// centered "IV" (Iron Vault) text.
///
/// {@tool snippet}
/// ```dart
/// LedgerLogo(size: 160)
/// ```
/// {@end-tool}
///
/// Place on dark backgrounds matching the app's theme (`#0F0F0F`).
class LedgerLogo extends StatelessWidget {
  /// The width and height of the logo in logical pixels.
  final double size;

  const LedgerLogo({super.key, this.size = 160});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: LedgerLogoPainter(size: size),
    );
  }
}

// ─── Painter ─────────────────────────────────────────────────────

/// Custom [CustomPainter] that renders the Iron Vault logo.
///
/// Layout (all coordinates relative to [size]):
///
///         ┌───────────────────────────────┐
///         │           ╱──╲                │
///         │         ╱      ╲              │
///         │        │   ╭──╮  │            │   ← outer hexagon (rounded)
///         │        │   │IV│  │            │   ← inner hexagon
///         │         ╲  ╰──╯  ╱            │   ← chip traces
///         │           ╲──╱                │
///         └───────────────────────────────┘
///
/// The hexagon has flat top/bottom edges (point-left & point-right
/// vertices), creating a wide, modern shape.
class LedgerLogoPainter extends CustomPainter {
  final double size;

  LedgerLogoPainter({required this.size});

  /// Re-paint only when [size] changes.
  @override
  bool shouldRepaint(covariant LedgerLogoPainter oldDelegate) {
    return oldDelegate.size != size;
  }

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final center = Offset(size / 2, size / 2);
    final outerRadius = size / 2 * 0.85;
    final innerRadius = size / 2 * 0.55;
    final coreRadius = size / 2 * 0.35;

    // ── Compute hexagon vertices ─────────────────────────────────
    // 6 vertices starting from top-right, going clockwise.
    // A wide (flat-top) hexagon: vertices at angles ±0°, ±60°, ±120°
    // measured from the right-horizontal axis.

    List<Offset> hexVertices(double radius) {
      return List.generate(6, (i) {
        final angle = 2 * math.pi * i / 6;
        return Offset(
          center.dx + radius * math.cos(angle),
          center.dy + radius * math.sin(angle),
        );
      });
    }

    final outerVerts = hexVertices(outerRadius);
    final innerVerts = hexVertices(innerRadius);
    final coreVerts = hexVertices(coreRadius);

    // ── Paints ───────────────────────────────────────────────────

    final outerStroke = Paint()
      ..color = _primaryGreen
      ..style = PaintingStyle.stroke
      ..strokeWidth = size * 0.04
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final innerStroke = Paint()
      ..color = _primaryGreen.withAlpha(160)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size * 0.02
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final tracePaint = Paint()
      ..color = _traceGreen.withAlpha(100)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size * 0.012
      ..strokeCap = StrokeCap.round;

    final padPaint = Paint()
      ..color = _traceGreen
      ..style = PaintingStyle.fill;

    final coreFill = Paint()
      ..color = _chipDark.withAlpha(120)
      ..style = PaintingStyle.fill;

    // ── Draw outer hexagon (thick green stroke) ──────────────────
    canvas.drawPath(_hexagonPath(outerVerts), outerStroke);

    // ── Draw inner hexagon (thinner, semi-transparent) ───────────
    canvas.drawPath(_hexagonPath(innerVerts), innerStroke);

    // ── Draw core chip area (filled darker hexagon) ──────────────
    canvas.drawPath(_hexagonPath(coreVerts), coreFill);

    // ── Draw circuit traces ──────────────────────────────────────
    // Horizontal center line
    canvas.drawLine(
      Offset(innerVerts[4].dx, center.dy),
      Offset(innerVerts[1].dx, center.dy),
      tracePaint,
    );

    // Vertical center line
    canvas.drawLine(
      Offset(center.dx, innerVerts[0].dy),
      Offset(center.dx, innerVerts[3].dy),
      tracePaint,
    );

    // Diagonal traces from center to inner vertices
    for (final vert in coreVerts) {
      canvas.drawLine(center, vert, tracePaint);
    }

    // ── Draw contact pads at outer vertices ──────────────────────
    for (final vert in outerVerts) {
      canvas.drawCircle(vert, size * 0.03, padPaint);
    }

    // Pads at inner vertices (slightly smaller)
    final innerPadPaint = Paint()
      ..color = _traceGreen.withAlpha(150)
      ..style = PaintingStyle.fill;
    for (final vert in innerVerts) {
      canvas.drawCircle(vert, size * 0.018, innerPadPaint);
    }

    // ── Draw "IV" text ───────────────────────────────────────────
    _drawCenteredText(
      canvas,
      'IV',
      center,
      size * 0.28,
      Colors.white,
    );
  }

  /// Creates a closed [Path] from a list of hexagon vertices.
  Path _hexagonPath(List<Offset> vertices) {
    final path = Path();
    path.moveTo(vertices[0].dx, vertices[0].dy);
    for (int i = 1; i < vertices.length; i++) {
      path.lineTo(vertices[i].dx, vertices[i].dy);
    }
    path.close();
    return path;
  }

  /// Draws [text] centered at [position] using a [TextPainter].
  void _drawCenteredText(
    Canvas canvas,
    String text,
    Offset position,
    double fontSize,
    Color color,
  ) {
    final textStyle = TextStyle(
      color: color,
      fontSize: fontSize,
      fontWeight: FontWeight.w800,
      letterSpacing: 2,
    );
    final textSpan = TextSpan(text: text, style: textStyle);
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        position.dx - textPainter.width / 2,
        position.dy - textPainter.height / 2,
      ),
    );
  }
}

// ─── Visual demo page (used by exercises_main.dart) ───────────────

/// Demo page showing the LedgerLogo at three sizes on a dark background.
class LedgerLogoDemoPage extends StatelessWidget {
  const LedgerLogoDemoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // app dark background
      appBar: AppBar(
        title: const Text('Exercise 6: Ledger Logo'),
        backgroundColor: const Color(0xFF0F0F0F),
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const LedgerLogo(size: 80),
              const SizedBox(height: 12),
              const Text(
                '80 px',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              const SizedBox(height: 32),
              const LedgerLogo(size: 160),
              const SizedBox(height: 12),
              const Text(
                '160 px',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              const SizedBox(height: 32),
              const LedgerLogo(size: 240),
              const SizedBox(height: 12),
              const Text(
                '240 px',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
