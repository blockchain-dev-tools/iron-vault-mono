import 'package:flutter/material.dart';

import '../../../theme/color_tokens.dart';

/// Draws a rounded-rectangle dashed border matching [BorderRadius.circular(R.lg)].
class DashedBorderPainter extends CustomPainter {
  final Color color;

  const DashedBorderPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    const radius = Radius.circular(R.lg);
    final rrect = RRect.fromLTRBR(1, 1, size.width - 1, size.height - 1, radius);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // Approximate dashes on the rounded rect perimeter.
    final path = Path()..addRRect(rrect);
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double distance = 0;
      while (distance < metric.length) {
        final end = (distance + 8).clamp(0, metric.length).toDouble();
        canvas.drawPath(
          metric.extractPath(distance, end),
          paint,
        );
        distance = end + 6;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
