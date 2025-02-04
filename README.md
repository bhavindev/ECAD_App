# Room Layout Editor

This project allows users to create and edit room layouts with interactive features.

## Features

- Creating two connected rooms step-by-step
- Smart features like auto-snapping to existing elements
- Intelligent wall merging between rooms
- Adding a door that automatically cuts through walls

## Technical Analysis

### 1. Creating Two Connected Rooms

We implemented a **room data structure** using React state. Each room is represented as an object with properties like width, height, and position. When a user draws a new room adjacent to an existing one, the system detects overlapping walls and aligns the rooms accordingly.

### 2. Smart Features: Auto-Snapping

The snapping mechanism listens for cursor movements and dynamically adjusts the new room's position when it's near another structure. We use **grid-based snapping** with a small threshold to provide a seamless user experience.

### 3. Intelligent Wall Merging

When two rooms share a common boundary, we identify shared walls and merge them instead of rendering separate overlapping walls. This is done through an **edge detection algorithm** that removes redundant walls while keeping the structure visually accurate.

### 4. Adding a Door that Cuts Through Walls

Doors are drawn using **canvas arc and line elements**. When a door is placed on a wall:

- The system detects the intersecting wall.
- The door is rendered within the wall, maintaining structural integrity.
- The wall is visually split to represent the cut.

These features create a fluid, interactive experience that makes room planning more intuitive.

## Installation

npm install
npm start
