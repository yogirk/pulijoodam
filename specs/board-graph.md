# Technical Board Specification

The board is represented as an undirected graph of **23 Nodes**.

## Board Layout

Apex at top, 4 slant lines radiate down through 4 horizontal levels.
Rectangle sides at x=-3 and x=3 between y=1 and y=3.
Levels: 1 (apex), 6, 6, 6, 4 (base) nodes.

## Node Definitions (JSON Structure)
```json
{
  "total_nodes": 23,
  "nodes": [
    {"id": 0, "label": "Apex", "adj": [2, 3, 4, 5]},
    {"id": 1, "label": "L3_1", "adj": [2, 7]},
    {"id": 2, "label": "L3_2", "adj": [0, 1, 3, 8]},
    {"id": 3, "label": "L3_3", "adj": [0, 2, 4, 9]},
    {"id": 4, "label": "L3_4", "adj": [0, 3, 5, 10]},
    {"id": 5, "label": "L3_5", "adj": [0, 4, 6, 11]},
    {"id": 6, "label": "L3_6", "adj": [5, 12]},
    {"id": 7, "label": "L2_1", "adj": [1, 8, 13]},
    {"id": 8, "label": "L2_2", "adj": [2, 7, 9, 14]},
    {"id": 9, "label": "L2_3", "adj": [3, 8, 10, 15]},
    {"id": 10, "label": "L2_4", "adj": [4, 9, 11, 16]},
    {"id": 11, "label": "L2_5", "adj": [5, 10, 12, 17]},
    {"id": 12, "label": "L2_6", "adj": [6, 11, 18]},
    {"id": 13, "label": "L1_1", "adj": [7, 14]},
    {"id": 14, "label": "L1_2", "adj": [8, 13, 15, 19]},
    {"id": 15, "label": "L1_3", "adj": [9, 14, 16, 20]},
    {"id": 16, "label": "L1_4", "adj": [10, 15, 17, 21]},
    {"id": 17, "label": "L1_5", "adj": [11, 16, 18, 22]},
    {"id": 18, "label": "L1_6", "adj": [12, 17]},
    {"id": 19, "label": "L0_1", "adj": [14, 20]},
    {"id": 20, "label": "L0_2", "adj": [15, 19, 21]},
    {"id": 21, "label": "L0_3", "adj": [16, 20, 22]},
    {"id": 22, "label": "L0_4", "adj": [17, 21]}
  ]
}
```

## Collinear Lines (for capture/jump paths)
```
S1: [0, 2, 8, 14, 19]      — outer-left slant
S2: [0, 3, 9, 15, 20]      — inner-left slant
S3: [0, 4, 10, 16, 21]     — inner-right slant
S4: [0, 5, 11, 17, 22]     — outer-right slant
H3: [1, 2, 3, 4, 5, 6]     — level 3 horizontal
H2: [7, 8, 9, 10, 11, 12]  — level 2 horizontal
H1: [13, 14, 15, 16, 17, 18] — level 1 horizontal
H0: [19, 20, 21, 22]        — base horizontal
VL: [1, 7, 13]              — left vertical
VR: [6, 12, 18]             — right vertical
```
