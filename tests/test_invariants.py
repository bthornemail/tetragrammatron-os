import json
import tempfile
import unittest

from core.geometry import fano_svg, triad_to_svg, invariants


class InvariantsTest(unittest.TestCase):
    def test_analyze_valid_frame(self):
        events = triad_to_svg.triads_to_events(
            [{"op": "TRIAD", "a": "state", "b": "alphabet", "c": "delta"}]
        )
        frames = fano_svg.events_to_frames(events)
        report = invariants.analyze_frames(frames)
        self.assertTrue(report[0]["axis_ok"])
        self.assertTrue(report[0]["line_ok"])

    def test_axis_mismatch_detected(self):
        events = [
            {"op": "FRAME_BEGIN"},
            {"op": "DRAW_FANO_POINT", "point": 0, "style": 0, "axis": "alphabet"},
            {"op": "FRAME_END"},
        ]
        frames = fano_svg.events_to_frames(events)
        report = invariants.analyze_frames(frames)
        self.assertFalse(report[0]["axis_ok"])
        self.assertEqual(report[0]["axis_issues"][0]["expected"], "state")

    def test_cli_exit_nonzero_on_failure(self):
        events = [
            {"op": "FRAME_BEGIN"},
            {"op": "DRAW_FANO_POINT", "point": 0, "style": 0, "axis": "alphabet"},
            {"op": "FRAME_END"},
        ]
        with tempfile.NamedTemporaryFile("w+", delete=False) as tmp:
            for ev in events:
                tmp.write(json.dumps(ev) + "\n")
            tmp.flush()
            rc = invariants.cli([tmp.name])
        self.assertEqual(rc, 1)


if __name__ == "__main__":
    unittest.main()
