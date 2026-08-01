// exercises_main.dart — Standalone entry point for the exercise runner app.
//
// Run with:  flutter run -t lib/exercises_main.dart
// Or:        flutter build apk -t lib/exercises_main.dart
//
// Lists all 25 exercises from the 6-layer curriculum.
// Clicking an implemented exercise opens its demo page.

import 'package:flutter/material.dart';
import 'exercise_list.dart';
import 'minimal_theme.dart';
import 'shake_widget.dart';
import 'magnetic_scroll.dart';
import 'sliver_parallax.dart';
import '../../lib/theme/widgets/ledger_logo.dart';

void main() => runApp(const ExercisesApp());

class ExercisesApp extends StatelessWidget {
  const ExercisesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Exercises',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF8FC322)),
        useMaterial3: true,
      ),
      home: const ExerciseHomePage(),
    );
  }
}

class ExerciseHomePage extends StatelessWidget {
  const ExerciseHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter 进阶练习'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: exercises.length,
        itemBuilder: (context, index) {
          final ex = exercises[index];
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: ex.implemented
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.surfaceContainerHighest,
                child: Text(
                  '${ex.number}',
                  style: TextStyle(
                    color: ex.implemented ? Colors.white : Colors.grey,
                  ),
                ),
              ),
              title: Text(ex.title, style: const TextStyle(fontSize: 14)),
              subtitle: Text(ex.brief, style: const TextStyle(fontSize: 12)),
              trailing: ex.implemented
                  ? const Icon(Icons.play_circle_fill)
                  : const Icon(Icons.lock_outline, color: Colors.grey),
              enabled: ex.implemented,
              onTap: ex.implemented
                  ? () => _openExercise(context, ex)
                  : null,
            ),
          );
        },
      ),
    );
  }

  void _openExercise(BuildContext context, ExerciseItem ex) {
    switch (ex.number) {
      case 1:
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const MinimalThemeDemoPage(),
          ),
        );
      case 3:
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const ShakeWidgetDemoPage(),
          ),
        );
      case 4:
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const MagneticScrollDemoPage(),
          ),
        );
      case 5:
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const SliverParallaxDemoPage(),
          ),
        );
      case 6:
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const LedgerLogoDemoPage(),
          ),
        );
    }
  }
}

// ── Exercise 1 demo —──────────────────────────────────────────────

class MinimalThemeDemoPage extends StatefulWidget {
  const MinimalThemeDemoPage({super.key});

  @override
  State<MinimalThemeDemoPage> createState() => _MinimalThemeDemoPageState();
}

class _MinimalThemeDemoPageState extends State<MinimalThemeDemoPage> {
  bool _darkMode = true; // ignore: prefer_final_fields

  @override
  Widget build(BuildContext context) {
    return MinimalThemeProvider(
      theme: _darkMode ? MinimalTheme.dark : MinimalTheme.light,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: context.colors.background,
          appBar: AppBar(
            title: const Text('Exercise 1: Minimal Theme'),
            backgroundColor: context.colors.primary,
            foregroundColor: context.colors.onPrimary,
          ),
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Heading Typography', style: context.typography.heading),
                const SizedBox(height: 8),
                Text('Body text demonstrates the body style for regular content.',
                    style: context.typography.body),
                const SizedBox(height: 8),
                Text('Caption text', style: context.typography.caption),
                const SizedBox(height: 8),
                Text('Label style', style: context.typography.label),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.colors.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Surface card with text',
                    style: context.typography.body,
                  ),
                ),
                const SizedBox(height: 24),
                const Spacer(),
                Center(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _darkMode = !_darkMode),
                    child: Text('Switch to ${_darkMode ? 'Light' : 'Dark'}'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Exercise 3 demo —──────────────────────────────────────────────

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
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                ShakeWidget.shake(_shakeKey.currentContext!);
              },
              child: const Text('Trigger Shake'),
            ),
          ],
        ),
      ),
    );
  }
}
