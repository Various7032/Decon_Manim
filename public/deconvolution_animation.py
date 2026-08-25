"""
Manim Animation Script: Charge-State Deconvolution in ESI Mass Spectrometry
Compatible with Manim Community Edition v0.18.0+

Usage:
    manim -pql deconvolution_animation.py ESIDeconvolutionScene   (Low Quality Preview)
    manim -pqh deconvolution_animation.py ESIDeconvolutionScene   (High Quality 1080p)
    manim -pqk deconvolution_animation.py ESIDeconvolutionScene   (4K 60fps Production)
"""

from manim import *
import numpy as np

# Configure global aesthetic palette (Minimalist 2D Infographic)
config.background_color = "#121316"

COLOR_BG = "#121316"
COLOR_PANEL = "#1c1d22"
COLOR_AXIS = "#64748b"
COLOR_GRID = "#27272a"
COLOR_CYAN = "#06b6d4"       # Raw ESI Peaks
COLOR_CYAN_LIGHT = "#67e8f9"
COLOR_CORAL = "#f43f5e"      # Trial hypothesis Token
COLOR_CORAL_LIGHT = "#fda4af"
COLOR_GOLD = "#eab308"       # Theoretical True Mass (eg 24,000 Da)
COLOR_GOLD_LIGHT = "#fef08a"
COLOR_TEXT_MUTED = "#94a3b8"
COLOR_TEXT_BRIGHT = "#f8fafc"

class ESIDeconvolutionScene(Scene):
    def construct(self):
        # -------------------------------------------------------------
        # Physical Parameters
        # -------------------------------------------------------------
        TRUE_MASS = 24000.0          # Reduced antibody light chain (Da)
        PROTON_MASS = 1.0078         # Adduct proton mass (Da)
        Z_MIN, Z_MAX = 10, 25        # Charge states observed in raw spectrum
        
        # Calculate discrete m/z values and envelope relative intensities
        charge_states = list(range(Z_MIN, Z_MAX + 1))
        # Bell-shaped envelope center around z=17, sigma=3.2
        mz_peaks = []
        for z in charge_states:
            mz_val = (TRUE_MASS + z * PROTON_MASS) / z
            # Normalized gaussian abundance
            abundance = np.exp(-((z - 17.0) ** 2) / (2 * (3.0 ** 2)))
            mz_peaks.append({
                "z": z,
                "mz": mz_val,
                "abundance": abundance
            })
            
        # Sort by m/z ascending (z=25 -> mz ~961, z=10 -> mz ~2401)
        mz_peaks.sort(key=lambda p: p["mz"])

        # -------------------------------------------------------------
        # Title & Header
        # -------------------------------------------------------------
        title = Text(
            "Charge-State Deconvolution in ESI-MS",
            font_size=28,
            weight=BOLD,
            color=COLOR_TEXT_BRIGHT
        ).to_edge(UP, buff=0.35)
        
        subtitle = Text(
            "Transformation from m/z envelope to true zero-charge mass (24,000 Da)",
            font_size=16,
            color=COLOR_TEXT_MUTED
        ).next_to(title, DOWN, buff=0.12)
        
        self.play(FadeIn(title, shift=DOWN*0.2), FadeIn(subtitle, shift=DOWN*0.2), run_time=0.8)
        self.wait(0.4)

        # -------------------------------------------------------------
        # SCENE 1: Raw Spectrum Coordinate System
        # -------------------------------------------------------------
        # Upper Axes: m/z (800 to 2600) vs Relative Abundance (0 to 1.1)
        axes_mz = Axes(
            x_range=[800, 2600, 400],
            y_range=[0, 1.15, 0.5],
            x_length=11.5,
            y_length=2.4,
            axis_config={
                "color": COLOR_AXIS,
                "stroke_width": 2,
                "include_ticks": True,
                "tick_size": 0.08,
            },
        ).shift(UP * 0.95)

        x_label_mz = Text("m/z (Mass-to-Charge Ratio)", font_size=15, color=COLOR_TEXT_MUTED)
        x_label_mz.next_to(axes_mz.x_axis, DOWN, buff=0.15).shift(RIGHT * 3.2)
        
        y_label_mz = Text("Relative Abundance", font_size=14, color=COLOR_TEXT_MUTED)
        y_label_mz.rotate(90 * DEGREES).next_to(axes_mz.y_axis, LEFT, buff=0.2)

        # X-axis tick numbers for m/z
        mz_numbers = VGroup()
        for x_val in range(800, 2800, 400):
            num = Text(str(x_val), font_size=12, color=COLOR_TEXT_MUTED)
            num.next_to(axes_mz.c2p(x_val, 0), DOWN, buff=0.1)
            mz_numbers.add(num)

        raw_spectrum_group = VGroup(axes_mz, x_label_mz, y_label_mz, mz_numbers)
        self.play(Create(axes_mz), Write(mz_numbers), FadeIn(x_label_mz), FadeIn(y_label_mz), run_time=1.0)

        # Draw Bell Envelope Curve (subtle dashed guidance)
        def envelope_func(x):
            z_cont = TRUE_MASS / max(x - PROTON_MASS, 1.0)
            val = np.exp(-((z_cont - 17.0) ** 2) / (2 * (3.0 ** 2)))
            return val if 900 <= x <= 2500 else 0.0

        curve = axes_mz.plot(envelope_func, x_range=[940, 2450], color=COLOR_CYAN, stroke_opacity=0.3, stroke_width=1.5)
        self.play(Create(curve), run_time=0.6)

        # Draw Centroid Peak Sticks
        peak_lines = VGroup()
        peak_dots = VGroup()
        peak_labels = VGroup()

        for p in mz_peaks:
            p_base = axes_mz.c2p(p["mz"], 0)
            p_top = axes_mz.c2p(p["mz"], p["abundance"])
            
            line = Line(p_base, p_top, color=COLOR_CYAN, stroke_width=2.5)
            dot = Dot(p_top, radius=0.045, color=COLOR_CYAN_LIGHT)
            
            # Label charge state e.g., +17
            lbl = Text(f"+{p['z']}", font_size=10, color=COLOR_CYAN_LIGHT)
            lbl.next_to(p_top, UP, buff=0.06)
            
            peak_lines.add(line)
            peak_dots.add(dot)
            peak_labels.add(lbl)

        self.play(
            LaggedStart(*[Create(l) for l in peak_lines], lag_ratio=0.04),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in peak_dots], lag_ratio=0.04),
            LaggedStart(*[FadeIn(lbl, shift=UP*0.1) for lbl in peak_labels], lag_ratio=0.04),
            run_time=1.4
        )
        self.wait(0.5)

        # -------------------------------------------------------------
        # SCENE 3 Setup: Lower Coordinate System (True Molecular Mass)
        # -------------------------------------------------------------
        axes_mass = Axes(
            x_range=[5000, 75000, 10000],
            y_range=[0, 18, 5],
            x_length=11.5,
            y_length=1.8,
            axis_config={
                "color": COLOR_AXIS,
                "stroke_width": 2,
                "include_ticks": True,
                "tick_size": 0.08,
            },
        ).shift(DOWN * 2.3)

        x_label_mass = Text("True Molecular Mass (Da)", font_size=15, color=COLOR_TEXT_BRIGHT)
        x_label_mass.next_to(axes_mass.x_axis, DOWN, buff=0.15).shift(RIGHT * 3.2)

        mass_numbers = VGroup()
        for m_val in range(10000, 80000, 10000):
            lbl_txt = f"{int(m_val/1000)}k"
            num = Text(lbl_txt, font_size=12, color=COLOR_TEXT_MUTED)
            num.next_to(axes_mass.c2p(m_val, 0), DOWN, buff=0.1)
            mass_numbers.add(num)

        # Highlight 24k mark
        mark_24k_pos = axes_mass.c2p(24000, 0)
        target_tick = Dot(mark_24k_pos, radius=0.05, color=COLOR_GOLD)
        target_label = Text("24,000 Da Target", font_size=11, weight=BOLD, color=COLOR_GOLD)
        target_label.next_to(mark_24k_pos, DOWN, buff=0.35)

        self.play(
            Create(axes_mass),
            Write(mass_numbers),
            FadeIn(x_label_mass),
            FadeIn(target_tick),
            FadeIn(target_label),
            run_time=0.9
        )
        self.wait(0.3)

        # -------------------------------------------------------------
        # SCENE 2: Mathematical Transformation Formula Badge
        # -------------------------------------------------------------
        formula_box = RoundedRectangle(
            corner_radius=0.15,
            width=5.8,
            height=0.85,
            fill_color=COLOR_PANEL,
            fill_opacity=0.95,
            stroke_color=COLOR_CYAN,
            stroke_width=1.5
        ).move_to(DOWN * 0.75)

        formula_text = MathTex(
            r"\text{Mass} = \left( m/z - 1.0078 \right) \times z_{\text{test}}",
            font_size=24,
            color=COLOR_TEXT_BRIGHT
        ).move_to(formula_box.get_center())

        self.play(FadeIn(formula_box, shift=UP*0.2), Write(formula_text), run_time=0.8)
        self.wait(0.4)

        # -------------------------------------------------------------
        # SCENE 2 & 3: Sequential Highlight, Token Generation & Dropping
        # -------------------------------------------------------------
        stacked_count = 0
        all_dropped_tokens = VGroup()

        detailed_indices = [3, 7, 10]  # corresponding to z=22, z=18, z=15
        
        for idx in detailed_indices:
            peak = mz_peaks[idx]
            p_top = axes_mz.c2p(peak["mz"], peak["abundance"])
            
            # 1. Highlight ring on active peak
            halo = Circle(radius=0.18, color=COLOR_CYAN_LIGHT, stroke_width=3).move_to(p_top)
            peak_info = Text(
                f"Peak m/z = {peak['mz']:.1f}",
                font_size=13,
                color=COLOR_CYAN_LIGHT
            ).next_to(halo, UP, buff=0.12)

            self.play(Create(halo), FadeIn(peak_info, shift=UP*0.1), run_time=0.4)

            # 2. Trial charge calculations
            trial_z_values = [8, 12, 15, peak["z"], 22, 26, 30]
            trial_z_values = sorted(list(set(trial_z_values)))

            trial_tokens_group = VGroup()

            for z_test in trial_z_values:
                calc_mass = (peak["mz"] - PROTON_MASS) * z_test
                is_match = (z_test == peak["z"])
                
                if calc_mass < 5000 or calc_mass > 75000:
                    continue

                tok_color = COLOR_GOLD if is_match else COLOR_CORAL
                radius = 0.08 if not is_match else 0.11

                tok_start = formula_box.get_center() + RIGHT * ((z_test - 18) * 0.22)
                token = Dot(tok_start, radius=radius, color=tok_color)
                
                if is_match:
                    stacked_count += 1
                    target_pos = axes_mass.c2p(24000, stacked_count * 0.9)
                else:
                    target_pos = axes_mass.c2p(calc_mass, 0.4 + np.random.uniform(0.1, 0.5))

                trial_tokens_group.add((token, target_pos, is_match))

            spawn_anims = [FadeIn(t[0], scale=0.3) for t in trial_tokens_group]
            self.play(*spawn_anims, run_time=0.4)

            drop_anims = [
                t[0].animate(rate_func=rate_functions.ease_out_bounce).move_to(t[1])
                for t in trial_tokens_group
            ]
            self.play(*drop_anims, run_time=0.8)

            for t in trial_tokens_group:
                all_dropped_tokens.add(t[0])

            self.play(FadeOut(halo), FadeOut(peak_info), run_time=0.3)

        # -------------------------------------------------------------
        # SCENE 4: Accelerated Convergence of All Remaining Peaks
        # -------------------------------------------------------------
        speed_badge = Text(
            "Accelerating Deconvolution across all observed m/z peaks...",
            font_size=14,
            weight=SEMIBOLD,
            color=COLOR_CYAN_LIGHT
        ).next_to(formula_box, DOWN, buff=0.15)

        self.play(FadeIn(speed_badge, shift=UP*0.1), run_time=0.4)

        fast_anims = []
        remaining_indices = [i for i in range(len(mz_peaks)) if i not in detailed_indices]

        for idx in remaining_indices:
            peak = mz_peaks[idx]
            
            stacked_count += 1
            true_token = Dot(
                axes_mz.c2p(peak["mz"], peak["abundance"]),
                radius=0.11,
                color=COLOR_GOLD
            )
            target_true_pos = axes_mass.c2p(24000, stacked_count * 0.85)

            noise_tokens = []
            for false_z in [peak["z"] - 4, peak["z"] + 3, peak["z"] + 7]:
                if 5 <= false_z <= 32 and false_z != peak["z"]:
                    calc_m = (peak["mz"] - PROTON_MASS) * false_z
                    if 5000 <= calc_m <= 75000:
                        n_tok = Dot(axes_mz.c2p(peak["mz"], peak["abundance"]), radius=0.065, color=COLOR_CORAL)
                        n_target = axes_mass.c2p(calc_m, np.random.uniform(0.2, 0.8))
                        noise_tokens.append((n_tok, n_target))

            all_dropped_tokens.add(true_token)
            for nt in noise_tokens:
                all_dropped_tokens.add(nt[0])

            fast_anims.append(
                true_token.animate(rate_func=rate_functions.ease_in_out_quad).move_to(target_true_pos)
            )
            for nt in noise_tokens:
                fast_anims.append(
                    nt[0].animate(rate_func=rate_functions.ease_in_out_quad).move_to(nt[1])
                )

        self.play(
            LaggedStart(*fast_anims, lag_ratio=0.03),
            run_time=2.2
        )

        # -------------------------------------------------------------
        # Convergence Callout & Final Resolved Mass Peak
        # -------------------------------------------------------------
        pillar_box = SurroundingRectangle(
            VGroup(*[t for t in all_dropped_tokens if np.isclose(t.get_x(), axes_mass.c2p(24000, 0)[0], atol=0.2)]),
            color=COLOR_GOLD_LIGHT,
            buff=0.1,
            stroke_width=2.5
        )

        pillar_label = Text(
            "RESOLVED MONO-DISPERSE SPECIES\nM = 24,000 ± 0.5 Da (Light Chain)",
            font_size=13,
            weight=BOLD,
            color=COLOR_GOLD_LIGHT
        ).next_to(pillar_box, RIGHT, buff=0.35)

        noise_label = Text(
            "Non-convergent trial products (dispersed baseline noise)",
            font_size=11,
            color=COLOR_CORAL_LIGHT
        ).next_to(axes_mass.c2p(52000, 1.2), UP, buff=0.1)

        self.play(
            Create(pillar_box),
            FadeIn(pillar_label, shift=RIGHT*0.2),
            FadeIn(noise_label, shift=UP*0.1),
            FadeOut(speed_badge),
            run_time=1.0
        )
        self.wait(2.0)
