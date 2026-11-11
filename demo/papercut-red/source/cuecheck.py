"""Snap events must land on the unfold times in timeline.js."""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
text = open(os.path.join(HERE, 'timeline.js'), encoding='utf-8').read()
unfold = [float(x) for x in re.search(r'UNFOLD = \[([^\]]+)\]', text).group(1).split(',')]
events = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
snaps = [e['t'] for e in events['ev'] if e['type'] == 'snap']
if len(snaps) != len(unfold):
    sys.exit(f'snaps {len(snaps)} != unfolds {len(unfold)}')
for a, b in zip(snaps, unfold):
    if abs(a - b) > 0.0001:
        sys.exit(f'snap {a} != unfold {b}')
if abs(events['dur'] - 40) > 0.001:
    sys.exit(f"dur {events['dur']}")
print('cues ok', len(snaps))
