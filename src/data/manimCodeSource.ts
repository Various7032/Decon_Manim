export const MANIM_CODE = `"""
Manim Animation Script: Charge-State Deconvolution in ESI Mass Spectrometry
Compatible with Manim Community Edition v0.18.0 - v0.20+

Scientific Narrative:
  1. Unknown macromolecule observed via Electrospray Ionization (ESI-MS).
  2. Detector records m/z centroid peaks; true mass M and charge states z are unknown.
  3. Slow, zoomed inspection of Peak 1 (m/z = 961.01 Da/charge) with high-contrast color-coded arithmetic:
     - Hypothesis z=5:  (961.01 - 1.01) * 5  = 4,800 Da  -> Drops Coral Sphere at 4.8k Da
     - Hypothesis z=6:  (961.01 - 1.01) * 6  = 5,760 Da  -> Drops Coral Sphere at 5.76k Da
     - Hypothesis z=7:  (961.01 - 1.01) * 7  = 6,720 Da  -> Drops Coral Sphere at 6.72k Da
  4. Pan out to evaluate candidate charges z in [4, 32] across ALL observed peaks.
  5. All trial spheres are dropped onto the reconstructed mass domain [0, 75,000 Da]:
     - 24,000 Da: 100% Co-resonance (all 16 peaks agree -> Unambiguous True Mass!)
     - 12,000 Da: 50% 1/2 Sub-Harmonic Alias (even charges z/2)
     - 48,000 Da: 50% 2x Harmonic Alias (double charges 2z)
     - Dispersed baseline noise (destructive interference)

Usage:
    manim -pql deconvolution_animation.py ESIDeconvolutionScene   # Preview (480p)
    manim -pqh deconvolution_animation.py ESIDeconvolutionScene   # Full HD 1080p 60fps
    manim -pqk deconvolution_animation.py ESIDeconvolutionScene   # 4K 60fps Master
"""

from manim import *
import numpy as np

# Global minimal 2D infographic styling
config.background_color = "#121316"

COLOR_BG = "#121316"
COLOR_PANEL = "#1c1d22"
COLOR_AXIS = "#64748b"
COLOR_GRID = "#27272a"
COLOR_CYAN = "#06b6d4"       # Raw ESI Centroid Peaks / m/z terms
COLOR_CYAN_LIGHT = "#67e8f9"
COLOR_CORAL = "#f43f5e"      # Trial / Non-converging Candidate Masses
COLOR_CORAL_LIGHT = "#fda4af"
COLOR_AMBER = "#facc15"      # Multiplier charge z_test
COLOR_GOLD = "#eab308"       # Emergent True Mass (24,000 Da)
COLOR_GOLD_LIGHT = "#fef08a"
COLOR_BLUE_HARMONIC = "#38bdf8" # Harmonic aliases (12,000 Da & 48,000 Da)
COLOR_TEXT_MUTED = "#94a3b8"
COLOR_TEXT_BRIGHT = "#f8fafc"

class ESIDeconvolutionScene(MovingCameraScene):
    def construct(self):
        # -------------------------------------------------------------
        # Physical Simulation (Unknown Analyte Mass = 24,000 Da)
        # -------------------------------------------------------------
        TRUE_MASS = 24000.0          # Target Protein Mass (Da)
        PROTON_MASS = 1.0078         # Adduct H+ mass (Da)
        Z_MIN, Z_MAX = 10, 25        # Observed envelope charge states
        
        charge_states = list(range(Z_MIN, Z_MAX + 1))
        mz_peaks = []
        for z in charge_states:
            mz_val = (TRUE_MASS + z * PROTON_MASS) / z
            abundance = np.exp(-((z - 17.0) ** 2) / (2 * (3.0 ** 2)))
            mz_peaks.append({
                "z": z,
                "mz": mz_val,
                "abundance": abundance
            })
            
        # Sort ascending by m/z:
        # Peak 0: z=25 -> mz ~ 961.01
        # Peak 1: z=24 -> mz ~ 1001.01
        # Peak 2: z=23 -> mz ~ 1044.49 ...
        mz_peaks.sort(key=lambda p: p["mz"])

        # -------------------------------------------------------------
        # Title & Objective: Unknown Mass Reconstruction
        # -------------------------------------------------------------
        title = Text(
            "Charge-State Deconvolution: Solving an Unknown Mass",
            font_size=26,
            weight=BOLD,
            color=COLOR_TEXT_BRIGHT
        ).to_edge(UP, buff=0.35)
        
        subtitle = Text(
            "Raw spectrum measures only m/z. We test candidate charge states z_test to discover the true mass.",
            font_size=13,
            color=COLOR_TEXT_MUTED
        ).next_to(title, DOWN, buff=0.10)
        
        self.play(FadeIn(title, shift=DOWN*0.2), FadeIn(subtitle, shift=DOWN*0.2), run_time=1.2)
        self.wait(0.6)

        # -------------------------------------------------------------
        # Upper Axes: Observed m/z Spectrum (Detector Data)
        # -------------------------------------------------------------
        axes_mz = Axes(
            x_range=[800, 2600, 400],
            y_range=[0, 1.15, 0.5],
            x_length=11.5,
            y_length=2.2,
            axis_config={
                "color": COLOR_AXIS,
                "stroke_width": 2,
                "include_ticks": True,
                "tick_size": 0.08,
            },
        ).shift(UP * 1.0)

        x_label_mz = Text("Observed m/z (Mass-to-Charge Ratio)", font_size=13, color=COLOR_CYAN_LIGHT)
        x_label_mz.next_to(axes_mz.x_axis, DOWN, buff=0.15).shift(RIGHT * 3.2)
        
        y_label_mz = Text("Relative Abundance", font_size=12, color=COLOR_TEXT_MUTED)
        y_label_mz.rotate(90 * DEGREES).next_to(axes_mz.y_axis, LEFT, buff=0.2)

        mz_numbers = VGroup()
        for x_val in range(800, 2800, 400):
            num = Text(str(x_val), font_size=11, color=COLOR_TEXT_MUTED)
            num.next_to(axes_mz.c2p(x_val, 0), DOWN, buff=0.1)
            mz_numbers.add(num)

        self.play(Create(axes_mz), Write(mz_numbers), FadeIn(x_label_mz), FadeIn(y_label_mz), run_time=1.2)

        # Draw raw centroid peak sticks (labeled only with observed m/z values, not known charges)
        peak_lines = VGroup()
        peak_dots = VGroup()
        peak_labels = VGroup()

        for p in mz_peaks:
            p_base = axes_mz.c2p(p["mz"], 0)
            p_top = axes_mz.c2p(p["mz"], p["abundance"])
            
            line = Line(p_base, p_top, color=COLOR_CYAN, stroke_width=2.5)
            dot = Dot(p_top, radius=0.045, color=COLOR_CYAN_LIGHT)
            lbl = Text(f"{p['mz']:.1f}", font_size=9, color=COLOR_CYAN_LIGHT).next_to(p_top, UP, buff=0.06)
            
            peak_lines.add(line)
            peak_dots.add(dot)
            peak_labels.add(lbl)

        self.play(
            LaggedStart(*[Create(l) for l in peak_lines], lag_ratio=0.03),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in peak_dots], lag_ratio=0.03),
            LaggedStart(*[FadeIn(lbl, shift=UP*0.1) for lbl in peak_labels], lag_ratio=0.03),
            run_time=1.5
        )
        self.wait(0.6)

        # -------------------------------------------------------------
        # Lower Axes: Reconstructed Molecular Mass Domain [0 to 75,000 Da]
        # (NO predetermined target indicator - mass is strictly unknown!)
        # -------------------------------------------------------------
        axes_mass = Axes(
            x_range=[0, 75000, 10000],
            y_range=[0, 20, 5],
            x_length=11.5,
            y_length=1.8,
            axis_config={
                "color": COLOR_AXIS,
                "stroke_width": 2,
                "include_ticks": True,
                "tick_size": 0.08,
            },
        ).shift(DOWN * 2.3)

        x_label_mass = Text("Reconstructed Molecular Mass (Da) [Search Domain]", font_size=13, color=COLOR_TEXT_BRIGHT)
        x_label_mass.next_to(axes_mass.x_axis, DOWN, buff=0.15).shift(RIGHT * 2.6)

        mass_numbers = VGroup()
        for m_val in range(0, 80000, 10000):
            lbl_txt = f"{int(m_val/1000)}k" if m_val > 0 else "0"
            num = Text(lbl_txt, font_size=11, color=COLOR_TEXT_MUTED)
            num.next_to(axes_mass.c2p(m_val, 0), DOWN, buff=0.1)
            mass_numbers.add(num)

        self.play(
            Create(axes_mass),
            Write(mass_numbers),
            FadeIn(x_label_mass),
            run_time=1.0
        )
        self.wait(0.5)

        # -------------------------------------------------------------
        # STEP 1: CAMERA ZOOM & SPOTLIGHT ON FIRST OBSERVED PEAK
        # -------------------------------------------------------------
        first_peak = mz_peaks[0]  # mz = 961.01
        p1_top = axes_mz.c2p(first_peak["mz"], first_peak["abundance"])
        
        focus_ring = Circle(radius=0.25, color=COLOR_CYAN_LIGHT, stroke_width=3).move_to(p1_top)
        peak1_tag = Text("Peak 1: m/z = 961.01", font_size=14, weight=BOLD, color=COLOR_CYAN_LIGHT).next_to(focus_ring, UP, buff=0.18)

        # Smooth camera zoom into Peak 1
        self.play(
            Create(focus_ring),
            FadeIn(peak1_tag),
            self.camera.frame.animate.set(width=8.8).move_to(axes_mz.c2p(1120, 0.4) + DOWN*0.65),
            run_time=2.2
        )
        self.wait(0.8)

        # -------------------------------------------------------------
        # HIGH-CONTRAST COLOR-COORDINATED ARITHMETIC CARDS (z=5, 6, 7)
        # -------------------------------------------------------------
        math_card = RoundedRectangle(
            corner_radius=0.14, width=6.2, height=1.6,
            fill_color="#18191f", fill_opacity=0.98, stroke_color=COLOR_CYAN, stroke_width=2.0
        ).move_to(axes_mz.c2p(1380, 0.3) + DOWN*0.55)

        # Color-coordinated formula 1 (z = 5)
        math_title_1 = Text("Hypothesis 1: Test Charge z = 5", font_size=14, weight=BOLD, color=COLOR_CORAL_LIGHT).move_to(math_card.get_top() + DOWN*0.28)
        
        # (961.01 - 1.01) * 5 = 4,800 Da
        math_eq_1 = MathTex(
            r"\left( {\color{#06b6d4}961.01} - {\color{#94a3b8}1.01} \right) \times {\color{#facc15}5} = {\color{#f43f5e}\mathbf{4{,}800\text{ Da}}}",
            font_size=20
        ).move_to(math_card.get_center() + DOWN*0.12)

        self.play(FadeIn(math_card), FadeIn(math_title_1), Write(math_eq_1), run_time=1.4)
        self.wait(0.8)

        # Spawn Sphere 1 (Coral, 4,800 Da)
        tok_z5 = Dot(math_card.get_bottom() + UP*0.15, radius=0.10, color=COLOR_CORAL)
        pos_4800 = axes_mass.c2p(4800, 0.5)
        guide_line_1 = DashedLine(tok_z5.get_center(), pos_4800, color=COLOR_CORAL, stroke_opacity=0.6, stroke_width=1.5)
        
        self.play(FadeIn(tok_z5, scale=0.5), Create(guide_line_1), run_time=0.6)
        self.play(
            tok_z5.animate(rate_func=rate_functions.ease_out_bounce).move_to(pos_4800),
            run_time=1.6
        )
        self.play(FadeOut(guide_line_1), run_time=0.3)
        self.wait(0.8)

        # Color-coordinated formula 2 (z = 6)
        math_title_2 = Text("Hypothesis 2: Test Charge z = 6", font_size=14, weight=BOLD, color=COLOR_CORAL_LIGHT).move_to(math_card.get_top() + DOWN*0.28)
        math_eq_2 = MathTex(
            r"\left( {\color{#06b6d4}961.01} - {\color{#94a3b8}1.01} \right) \times {\color{#facc15}6} = {\color{#f43f5e}\mathbf{5{,}760\text{ Da}}}",
            font_size=20
        ).move_to(math_card.get_center() + DOWN*0.12)

        self.play(
            Transform(math_title_1, math_title_2),
            Transform(math_eq_1, math_eq_2),
            run_time=1.0
        )
        self.wait(0.8)

        # Spawn Sphere 2 (Coral, 5,760 Da)
        tok_z6 = Dot(math_card.get_bottom() + UP*0.15, radius=0.10, color=COLOR_CORAL)
        pos_5760 = axes_mass.c2p(5760, 0.5)
        guide_line_2 = DashedLine(tok_z6.get_center(), pos_5760, color=COLOR_CORAL, stroke_opacity=0.6, stroke_width=1.5)

        self.play(FadeIn(tok_z6, scale=0.5), Create(guide_line_2), run_time=0.6)
        self.play(
            tok_z6.animate(rate_func=rate_functions.ease_out_bounce).move_to(pos_5760),
            run_time=1.6
        )
        self.play(FadeOut(guide_line_2), run_time=0.3)
        self.wait(0.8)

        # Color-coordinated formula 3 (z = 7)
        math_title_3 = Text("Hypothesis 3: Test Charge z = 7", font_size=14, weight=BOLD, color=COLOR_CORAL_LIGHT).move_to(math_card.get_top() + DOWN*0.28)
        math_eq_3 = MathTex(
            r"\left( {\color{#06b6d4}961.01} - {\color{#94a3b8}1.01} \right) \times {\color{#facc15}7} = {\color{#f43f5e}\mathbf{6{,}720\text{ Da}}}",
            font_size=20
        ).move_to(math_card.get_center() + DOWN*0.12)

        self.play(
            Transform(math_title_1, math_title_3),
            Transform(math_eq_1, math_eq_3),
            run_time=1.0
        )
        self.wait(0.8)

        # Spawn Sphere 3 (Coral, 6,720 Da)
        tok_z7 = Dot(math_card.get_bottom() + UP*0.15, radius=0.10, color=COLOR_CORAL)
        pos_6720 = axes_mass.c2p(6720, 0.5)
        guide_line_3 = DashedLine(tok_z7.get_center(), pos_6720, color=COLOR_CORAL, stroke_opacity=0.6, stroke_width=1.5)

        self.play(FadeIn(tok_z7, scale=0.5), Create(guide_line_3), run_time=0.6)
        self.play(
            tok_z7.animate(rate_func=rate_functions.ease_out_bounce).move_to(pos_6720),
            run_time=1.6
        )
        self.play(FadeOut(guide_line_3), run_time=0.3)
        self.wait(1.0)

        # -------------------------------------------------------------
        # STEP 2: PAN CAMERA OUT TO SHOW FULL EVALUATION ARRAY z=4..32
        # -------------------------------------------------------------
        self.play(
            FadeOut(focus_ring),
            FadeOut(peak1_tag),
            FadeOut(math_card),
            FadeOut(math_title_1),
            FadeOut(math_eq_1),
            self.camera.frame.animate.set(width=14.22).move_to(ORIGIN),
            run_time=2.2
        )
        self.wait(0.6)

        # Matrix Panel for candidate charge evaluation
        matrix_panel = RoundedRectangle(
            corner_radius=0.14, width=11.6, height=1.4,
            fill_color="#18191f", fill_opacity=0.96, stroke_color=COLOR_CYAN, stroke_width=1.5
        ).move_to(DOWN * 0.65)

        matrix_title = Text(
            "Evaluating candidate charge array z_test ∈ [4, 32] for Peak 1 (m/z = 961.01):",
            font_size=13, weight=BOLD, color=COLOR_CYAN_LIGHT
        ).move_to(matrix_panel.get_top() + DOWN*0.25)

        eval_callout = MathTex(
            r"(961.01 - 1.01) \times {\color{#facc15}z_{\text{test}}} \longrightarrow \text{Coral trial spheres dropped across search space}",
            font_size=15, color=COLOR_TEXT_BRIGHT
        ).move_to(matrix_panel.get_center() + DOWN*0.18)

        self.play(FadeIn(matrix_panel), FadeIn(matrix_title), Write(eval_callout), run_time=1.4)
        self.wait(1.0)

        # Drop ALL remaining trial spheres for Peak 1 across z=4 to 32 (spawning from apex of Peak 1)
        all_scene_tokens = [tok_z5, tok_z6, tok_z7]
        p1_new_tokens = []
        p1_drop_anims = []
        p1_apex = axes_mz.c2p(first_peak["mz"], first_peak["abundance"])

        for z_t in range(4, 33):
            if z_t in [5, 6, 7]:
                continue
            calc_m = (first_peak["mz"] - PROTON_MASS) * z_t
            if calc_m < 0 or calc_m > 75000:
                continue

            is_true_match = (z_t == 25)
            rad = 0.10 if is_true_match else 0.08

            # All tokens start as Coral spheres dropped from peak apex
            tok = Dot(p1_apex, radius=rad, color=COLOR_CORAL)
            
            if is_true_match:
                target_pos = axes_mass.c2p(24000, 0.9)
            elif abs(calc_m - 12000) < 600:
                target_pos = axes_mass.c2p(12000, 0.7)
            else:
                target_pos = axes_mass.c2p(calc_m, 0.4 + np.random.uniform(0.1, 0.5))

            p1_new_tokens.append(tok)
            all_scene_tokens.append(tok)
            p1_drop_anims.append(tok.animate(rate_func=rate_functions.ease_out_bounce).move_to(target_pos))

        self.play(LaggedStart(*[FadeIn(t, scale=0.4) for t in p1_new_tokens], lag_ratio=0.035), run_time=1.2)
        self.play(LaggedStart(*p1_drop_anims, lag_ratio=0.035), run_time=2.4)
        self.wait(1.2)
        self.play(FadeOut(matrix_panel), FadeOut(matrix_title), FadeOut(eval_callout), run_time=0.7)

        # -------------------------------------------------------------
        # STEP 3: SYSTEMATIC DECONVOLUTION OF ALL REMAINING PEAKS
        # (Drop ALL candidate spheres across all charge states from apex in CORAL!)
        # -------------------------------------------------------------
        deconv_badge = Text(
            "Testing candidate charge states z_test ∈ [4, 32] across all observed peaks...",
            font_size=13, weight=BOLD, color=COLOR_TEXT_BRIGHT
        ).move_to(DOWN * 0.75)

        self.play(FadeIn(deconv_badge), run_time=0.9)

        # Track stacks at key co-resonances
        true_stack = 1
        half_stack = 1
        double_stack = 0

        multi_peak_anims = []

        for idx in range(1, len(mz_peaks)):
            peak = mz_peaks[idx]
            p_top = axes_mz.c2p(peak["mz"], peak["abundance"])
            true_z = peak["z"]

            # Test all candidate charges z_test in range [6, 32]
            for z_test in range(6, 33):
                calc_m = (peak["mz"] - PROTON_MASS) * z_test
                if calc_m < 0 or calc_m > 75000:
                    continue

                is_true = (z_test == true_z)
                is_half = (true_z % 2 == 0 and z_test == true_z // 2)
                is_double = (z_test == true_z * 2)

                # All trial spheres drop as CORAL initially
                if is_true:
                    true_stack += 1
                    tok = Dot(p_top, radius=0.10, color=COLOR_CORAL)
                    dest = axes_mass.c2p(24000, true_stack * 0.88)
                elif is_half:
                    half_stack += 1
                    tok = Dot(p_top, radius=0.085, color=COLOR_CORAL)
                    dest = axes_mass.c2p(12000, half_stack * 0.88)
                elif is_double:
                    double_stack += 1
                    tok = Dot(p_top, radius=0.085, color=COLOR_CORAL)
                    dest = axes_mass.c2p(48000, double_stack * 0.88)
                else:
                    # Noise trial mass
                    tok = Dot(p_top, radius=0.065, color=COLOR_CORAL)
                    dest = axes_mass.c2p(calc_m, np.random.uniform(0.3, 0.85))

                all_scene_tokens.append(tok)
                multi_peak_anims.append(
                    tok.animate(rate_func=rate_functions.ease_in_out_quad).move_to(dest)
                )

        # Run multi-peak drops with slowed pacing
        self.play(LaggedStart(*multi_peak_anims, lag_ratio=0.012), run_time=5.8)
        self.wait(1.4)

        # -------------------------------------------------------------
        # STEP 4: FINAL REVEAL (Color true mass GOLD and harmonics BLUE)
        # -------------------------------------------------------------
        true_pillar = VGroup(*[t for t in all_scene_tokens if np.isclose(t.get_x(), axes_mass.c2p(24000, 0)[0], atol=0.25)])
        half_pillar = VGroup(*[t for t in all_scene_tokens if np.isclose(t.get_x(), axes_mass.c2p(12000, 0)[0], atol=0.25)])
        double_pillar = VGroup(*[t for t in all_scene_tokens if np.isclose(t.get_x(), axes_mass.c2p(48000, 0)[0], atol=0.25)])

        # Color transformation at the end: True mass -> GOLD, Harmonics -> BLUE
        self.play(
            true_pillar.animate.set_color(COLOR_GOLD),
            half_pillar.animate.set_color(COLOR_BLUE_HARMONIC),
            double_pillar.animate.set_color(COLOR_BLUE_HARMONIC),
            FadeOut(deconv_badge),
            run_time=1.4
        )

        # 1. Main Peak Callout (24,000 Da in GOLD)
        true_box = SurroundingRectangle(true_pillar, color=COLOR_GOLD_LIGHT, buff=0.10, stroke_width=2.5)
        true_label = Text(
            "DISCOVERED TRUE MASS\nM = 24,000 Da (100% Co-Resonance)\nAll 16 charge states reinforce here!",
            font_size=12, weight=BOLD, color=COLOR_GOLD_LIGHT, line_spacing=1.2
        ).next_to(true_box, UP, buff=0.25)

        # 2. 1/2 Harmonic Alias Callout (12,000 Da in BLUE)
        half_box = SurroundingRectangle(half_pillar, color=COLOR_BLUE_HARMONIC, buff=0.08, stroke_width=1.8)
        half_label = Text(
            "1/2 Sub-Harmonic (12,000 Da)\n~50% height (even charges z/2)",
            font_size=10, color=COLOR_BLUE_HARMONIC, line_spacing=1.1
        ).next_to(half_box, UP, buff=0.15)

        # 3. 2x Harmonic Alias Callout (48,000 Da in BLUE)
        double_box = SurroundingRectangle(double_pillar, color=COLOR_BLUE_HARMONIC, buff=0.08, stroke_width=1.8)
        double_label = Text(
            "2x Harmonic (48,000 Da)\n~50% height (double charges 2z)",
            font_size=10, color=COLOR_BLUE_HARMONIC, line_spacing=1.1
        ).next_to(double_box, UP, buff=0.15)

        self.play(
            Create(true_box),
            FadeIn(true_label, shift=UP*0.1),
            Create(half_box),
            FadeIn(half_label, shift=UP*0.1),
            Create(double_box),
            FadeIn(double_label, shift=UP*0.1),
            run_time=1.8
        )
        self.wait(3.5)
`;
