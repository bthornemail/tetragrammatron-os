import unittest

from core.geometry import fano_svg, triad_to_svg


class TriadToSvgTest(unittest.TestCase):
    def test_valid_triad_maps_to_line(self):
        triads = [
            {"op": "TRIAD", "a": "state", "b": "alphabet", "c": "delta", "result": "accept"}
        ]
        events = triad_to_svg.triads_to_events(triads)
        frames = fano_svg.events_to_frames(events)
        svg = fano_svg.render_svg(frames, canvsl_hash="sha256:abc", title="Triad")

        self.assertIn('id="L0"', svg)
        self.assertIn('data-label-for="p0"', svg)
        self.assertIn('data-label-for="p1"', svg)
        self.assertIn('data-label-for="p2"', svg)
        self.assertIn("STATE", svg)

    def test_invalid_triad_uses_error_style(self):
        triads = [
            {"op": "TRIAD", "a": "state", "b": "left", "c": "right", "result": "accept"}
        ]
        events = triad_to_svg.triads_to_events(triads)
        frames = fano_svg.events_to_frames(events)
        svg = fano_svg.render_svg(frames)

        self.assertIn('class="point style-3"', svg)
        self.assertIn("LEFT✕", svg)

    def test_strip_inline_comment(self):
        line = '{"op":"TRIAD"}  // comment'
        stripped = triad_to_svg._strip_inline_comment(line)
        self.assertEqual(stripped, '{"op":"TRIAD"}')


if __name__ == "__main__":
    unittest.main()
