// chain_icons.dart — Five chain identity icons drawn with CustomPainter.
//
// Each icon follows the same pattern as LedgerLogo:
//   StatelessWidget wrapping CustomPaint with a dedicated Painter.
//
// Designs use simple geometric shapes (no complex paths) at a
// recognisable silhouette level. All dimensions are relative to
// the `size` parameter so the icons scale smoothly.

import 'dart:math' as math;

import 'package:flutter/material.dart';

// ── Default chain colours ──────────────────────────────────────────

const _ethColor = Color(0xFF627EEA);
const _solColor = Color(0xFF9945FF);
const _btcColor = Color(0xFFF7931A);
const _tronColor = Color(0xFFFF0013);
const _suiColor = Color(0xFF4DA2FF);

// ═════════════════════════════════════════════════════════════════════
// ETH — diamond with inner chevron
// ═════════════════════════════════════════════════════════════════════

class EthIcon extends StatelessWidget {
  final double size;
  final Color? color;

  const EthIcon({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _EthIconPainter(color: color ?? _ethColor),
    );
  }
}

class _EthIconPainter extends CustomPainter {
  final Color color;

  _EthIconPainter({required this.color});

  @override
  bool shouldRepaint(covariant _EthIconPainter oldDelegate) =>
      oldDelegate.color != color;

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    final r = s.width * 0.46;

    // Diamond vertices (rotated 45°)
    final top = Offset(cx, cy - r);
    final right = Offset(cx + r, cy);
    final bottom = Offset(cx, cy + r);
    final left = Offset(cx - r, cy);

    final fill = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final diamond = Path()
      ..moveTo(top.dx, top.dy)
      ..lineTo(right.dx, right.dy)
      ..lineTo(bottom.dx, bottom.dy)
      ..lineTo(left.dx, left.dy)
      ..close();
    canvas.drawPath(diamond, fill);

    // Inner cut-out — smaller diamond offset upward
    final innerR = r * 0.42;

    // Draw left and right chevron triangles with BlendMode.clear
    final bg = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill
      ..blendMode = BlendMode.clear;

    // Left chevron
    final leftChevron = Path()
      ..moveTo(cx, cy - innerR)
      ..lineTo(cx, cy + innerR)
      ..lineTo(cx - innerR, cy)
      ..close();
    canvas.drawPath(leftChevron, bg);

    // Right chevron
    final rightChevron = Path()
      ..moveTo(cx, cy - innerR)
      ..lineTo(cx, cy + innerR)
      ..lineTo(cx + innerR, cy)
      ..close();
    canvas.drawPath(rightChevron, bg);
  }
}

// ═════════════════════════════════════════════════════════════════════
// SOL — gradient circle with layered arcs
// ═════════════════════════════════════════════════════════════════════

class SolIcon extends StatelessWidget {
  final double size;
  final Color? color;

  const SolIcon({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _SolIconPainter(color: color ?? _solColor),
    );
  }
}

class _SolIconPainter extends CustomPainter {
  final Color color;

  _SolIconPainter({required this.color});

  @override
  bool shouldRepaint(covariant _SolIconPainter oldDelegate) =>
      oldDelegate.color != color;

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    final r = s.width * 0.45;

    // Gradient circle background
    final gradient = RadialGradient(
      center: const Alignment(-0.25, -0.3),
      colors: [color.withAlpha(230), color],
      radius: 1.2,
    );
    final bgPaint = Paint()
      ..shader = gradient.createShader(Rect.fromCircle(center: Offset(cx, cy), radius: r))
      ..style = PaintingStyle.fill;

    canvas.drawCircle(Offset(cx, cy), r, bgPaint);

    // Two intersecting oblique stripe segments
    final stripePaint = Paint()
      ..color = Colors.white.withAlpha(50)
      ..style = PaintingStyle.fill;

    _drawFilledArc(canvas, cx, cy, r * 0.75, -0.7, 2.1, stripePaint);
    _drawFilledArc(canvas, cx, cy, r * 0.55, 2.0, 2.1, stripePaint);
  }

  void _drawFilledArc(Canvas c, double cx, double cy, double r,
      double start, double sweep, Paint paint) {
    final path = Path()..moveTo(cx, cy);
    for (int i = 0; i <= 50; i++) {
      final a = start + sweep * i / 50;
      path.lineTo(cx + r * math.cos(a), cy + r * math.sin(a));
    }
    path.close();
    c.drawPath(path, paint);
  }
}

// ═════════════════════════════════════════════════════════════════════
// BTC — circle with capital B
// ═════════════════════════════════════════════════════════════════════

class BtcIcon extends StatelessWidget {
  final double size;
  final Color? color;

  const BtcIcon({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _BtcIconPainter(color: color ?? _btcColor),
    );
  }
}

class _BtcIconPainter extends CustomPainter {
  final Color color;

  _BtcIconPainter({required this.color});

  @override
  bool shouldRepaint(covariant _BtcIconPainter oldDelegate) =>
      oldDelegate.color != color;

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    final r = s.width * 0.44;

    // Filled orange circle
    final circlePaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(cx, cy), r, circlePaint);

    // Draw "B" glyph in white
    _drawCenteredText(
      canvas,
      '₿',
      Offset(cx, cy + s.height * 0.02),
      s.width * 0.52,
      Colors.white,
    );
  }

  void _drawCenteredText(
    Canvas canvas,
    String text,
    Offset position,
    double fontSize,
    Color c,
  ) {
    final ts = TextStyle(
      color: c,
      fontSize: fontSize,
      fontWeight: FontWeight.w800,
    );
    final tp = TextPainter(
      text: TextSpan(text: text, style: ts),
      textDirection: TextDirection.ltr,
    );
    tp.layout();
    tp.paint(
      canvas,
      Offset(position.dx - tp.width / 2, position.dy - tp.height / 2),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════
// TRX — hexagonal token
// ═════════════════════════════════════════════════════════════════════

class TronIcon extends StatelessWidget {
  final double size;
  final Color? color;

  const TronIcon({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _TronIconPainter(color: color ?? _tronColor),
    );
  }
}

class _TronIconPainter extends CustomPainter {
  final Color color;

  _TronIconPainter({required this.color});

  @override
  bool shouldRepaint(covariant _TronIconPainter oldDelegate) =>
      oldDelegate.color != color;

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    final r = s.width * 0.46;
    final strokeW = s.width * 0.065;

    // Hexagon stroke (flat top/bottom)
    final hex = _hexagonPath(cx, cy, r);

    final strokePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(hex, strokePaint);

    // Inner "T" shape — horizontal + vertical bar
    final fillPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final hw = r * 0.55; // half-width of the T bars

    // Vertical stem
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(cx, cy - r * 0.08),
        width: strokeW,
        height: r * 0.8,
      ),
      fillPaint,
    );

    // Top horizontal bar
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(cx, cy - r * 0.43),
        width: hw,
        height: strokeW,
      ),
      fillPaint,
    );
  }

  Path _hexagonPath(double cx, double cy, double r) {
    final path = Path();
    for (int i = 0; i < 6; i++) {
      final a = math.pi / 2 + i * math.pi / 3; // start from top
      final x = cx + r * math.cos(a);
      final y = cy - r * math.sin(a);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    return path;
  }
}

// ═════════════════════════════════════════════════════════════════════
// SUI — stylised wave
// ═════════════════════════════════════════════════════════════════════

class SuiIcon extends StatelessWidget {
  final double size;
  final Color? color;

  const SuiIcon({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _SuiIconPainter(color: color ?? _suiColor),
    );
  }
}

class _SuiIconPainter extends CustomPainter {
  final Color color;

  _SuiIconPainter({required this.color});

  @override
  bool shouldRepaint(covariant _SuiIconPainter oldDelegate) =>
      oldDelegate.color != color;

  @override
  void paint(Canvas canvas, Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    final r = s.width * 0.43;

    // Filled circle
    final circlePaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(cx, cy), r, circlePaint);

    // Stylised wave / "S" path in white
    final wavePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = s.width * 0.1
      ..strokeCap = StrokeCap.round;

    // Two overlapping cubic bezier curves forming an "S"
    final wave = Path();
    final top = cy - r * 0.35;
    final mid = cy;
    final bot = cy + r * 0.35;
    final left = cx - r * 0.45;
    final right = cx + r * 0.45;

    // Top loop (left to right, descending)
    wave.moveTo(left, top + r * 0.15);
    wave.cubicTo(cx, top - r * 0.1, cx, mid + r * 0.1, right, mid - r * 0.05);

    // Bottom loop (right to left, descending)
    wave.cubicTo(cx, mid - r * 0.1, cx, bot + r * 0.1, left, bot - r * 0.1);

    canvas.drawPath(wave, wavePaint);
  }
}
