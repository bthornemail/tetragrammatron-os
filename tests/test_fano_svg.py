import unittest

from core.geometry import fano_svg


class FanoSvgTest(unittest.TestCase):
    def test_render_single_frame(self):
        events = [
            {"op": "FRAME_BEGIN", "flags": ["lines", "points", "labels"]},
            {"op": "DRAW_FANO_LINE", "line": 0, "style": 1},
            {"op": "DRAW_FANO_POINT", "point": 0, "style": 2, "axis": "state"},
            {"op": "DRAW_FANO_POINT", "point": 6},  # default style
            {"op": "DRAW_FANO_CIRCLE_LINE", "style": 5},
            {"op": "LABEL_FANO_POINT", "point": 6, "text": "CENTER"},
            {"op": "FRAME_END"},
        ]
        frames = fano_svg.events_to_frames(events)
        svg = fano_svg.render_svg(frames, canvsl_hash="sha256:deadbeef", title="Test")

        self.assertIn('<title>Test</title>', svg)
        self.assertIn('data-canvsl-hash="sha256:deadbeef"', svg)
        self.assertIn('<line id="L0"', svg)
        circle_idx = svg.index('<circle id="Lcircle"')
        point_idx = svg.index('id="p0"')
        self.assertLess(circle_idx, point_idx, "circle-line must precede point output")
        self.assertIn('data-label-for="p6"', svg)
        self.assertIn('data-axis="state"', svg)

    def test_invalid_ids_raise(self):
        with self.assertRaises(fano_svg.EventError):
            fano_svg.events_to_frames([{"op": "DRAW_FANO_LINE", "line": 99}])

    def test_duplicate_draw_overwrites_style(self):
        events = [
            {"op": "DRAW_FANO_POINT", "point": 0, "style": 1},
            {"op": "DRAW_FANO_POINT", "point": 0, "style": 3},
        ]
        frames = fano_svg.events_to_frames(events)
        svg = fano_svg.render_svg(frames)
        self.assertIn('class="point style-3"', svg)


if __name__ == "__main__":
    unittest.main()
