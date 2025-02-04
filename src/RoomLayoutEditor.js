import React, { useState, useRef, useEffect } from "react";
import { GiResize } from "react-icons/gi";
import { MdOutlineDoorFront } from "react-icons/md";

const RoomLayoutEditor = () => {
  const [rooms, setRooms] = useState([]);
  const [doors, setDoors] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [selectedTool, setSelectedTool] = useState("room");
  const [snapPoints, setSnapPoints] = useState([]);
  const canvasRef = useRef(null);
  const gridSize = 20;
  const doorWidth = 40;

  useEffect(() => {
    drawEverything();
    updateSnapPoints();
  }, [rooms, doors, currentRoom]);

  const updateSnapPoints = () => {
    const points = [];
    rooms.forEach((room) => {
      points.push(
        { x: room.x, y: room.y },
        { x: room.x + room.width, y: room.y },
        { x: room.x, y: room.y + room.height },
        { x: room.x + room.width, y: room.y + room.height }
      );
    });
    setSnapPoints(points);
  };

  const snapToGrid = (value) => Math.round(value / gridSize) * gridSize;

  const snapToNearestPoint = (x, y) => {
    const snapDistance = 15;
    let closestPoint = { x: snapToGrid(x), y: snapToGrid(y) };
    let minDistance = Number.MAX_VALUE;

    snapPoints.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );
      if (distance < snapDistance && distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    return closestPoint;
  };

  const drawEverything = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    rooms.forEach((room) => {
      drawRoomWithDoors(ctx, room);
      drawRoomDimensions(ctx, room);
    });
    if (currentRoom) {
      drawRoom(ctx, currentRoom);
      drawRoomDimensions(ctx, currentRoom);
    }

    doors.forEach((door) => drawDoor(ctx, door));
  };

  const drawRoom = (ctx, room) => {
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#A9A9A9";
    ctx.lineWidth = 5;
    ctx.rect(room.x, room.y, room.width, room.height);
    ctx.fill();
    ctx.stroke();
  };
  const drawRoomDimensions = (ctx, room) => {
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    const widthInMeters = (room.width / gridSize).toFixed(1);
    const heightInMeters = (room.height / gridSize).toFixed(1);

    // Top width
    ctx.fillText(`${widthInMeters}`, room.x + room.width / 2, room.y - 5);
    // Bottom width
    ctx.fillText(
      `${widthInMeters}`,
      room.x + room.width / 2,
      room.y + room.height + 15
    );

    // Left height
    ctx.save();
    ctx.translate(room.x - 10, room.y + room.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${heightInMeters}`, 0, 0);
    ctx.restore();

    // Right height
    ctx.save();
    ctx.translate(room.x + room.width + 10, room.y + room.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${heightInMeters}`, 0, 0);
    ctx.restore();
  };

  const findWallIntersection = (x, y) => {
    const tolerance = gridSize / 2;
    for (const room of rooms) {
      let snappedX = snapToGrid(x);
      let snappedY = snapToGrid(y);

      if (
        Math.abs(snappedY - room.y) < tolerance &&
        snappedX >= room.x &&
        snappedX <= room.x + room.width
      ) {
        return { x: snappedX, y: room.y, orientation: "horizontal" };
      }
      if (
        Math.abs(snappedY - (room.y + room.height)) < tolerance &&
        snappedX >= room.x &&
        snappedX <= room.x + room.width
      ) {
        return {
          x: snappedX,
          y: room.y + room.height,
          orientation: "horizontal",
        };
      }
      if (
        Math.abs(snappedX - room.x) < tolerance &&
        snappedY >= room.y &&
        snappedY <= room.y + room.height
      ) {
        return { x: room.x, y: snappedY, orientation: "vertical" };
      }
      if (
        Math.abs(snappedX - (room.x + room.width)) < tolerance &&
        snappedY >= room.y &&
        snappedY <= room.y + room.height
      ) {
        return { x: room.x + room.width, y: snappedY, orientation: "vertical" };
      }
    }
    return null;
  };

  const drawRoomWithDoors = (ctx, room) => {
    ctx.beginPath();
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 5;

    const walls = [
      {
        start: { x: room.x, y: room.y },
        end: { x: room.x + room.width, y: room.y },
        isHorizontal: true,
      },
      {
        start: { x: room.x + room.width, y: room.y },
        end: { x: room.x + room.width, y: room.y + room.height },
        isHorizontal: false,
      },
      {
        start: { x: room.x, y: room.y + room.height },
        end: { x: room.x + room.width, y: room.y + room.height },
        isHorizontal: true,
      },
      {
        start: { x: room.x, y: room.y },
        end: { x: room.x, y: room.y + room.height },
        isHorizontal: false,
      },
    ];

    walls.forEach((wall) => {
      const wallDoors = doors.filter((door) => {
        if (wall.isHorizontal) {
          return (
            Math.abs(door.y - wall.start.y) < 1 &&
            door.x >= wall.start.x &&
            door.x <= wall.end.x
          );
        } else {
          return (
            Math.abs(door.x - wall.start.x) < 1 &&
            door.y >= wall.start.y &&
            door.y <= wall.end.y
          );
        }
      });

      if (wallDoors.length === 0) {
        ctx.moveTo(wall.start.x, wall.start.y);
        ctx.lineTo(wall.end.x, wall.end.y);
      } else {
        wallDoors.sort((a, b) => (wall.isHorizontal ? a.x - b.x : a.y - b.y));

        let currentPos = wall.isHorizontal ? wall.start.x : wall.start.y;
        wallDoors.forEach((door) => {
          const doorPos = wall.isHorizontal ? door.x : door.y;
          const halfDoorWidth = doorWidth / 2;

          if (doorPos - halfDoorWidth > currentPos) {
            if (wall.isHorizontal) {
              ctx.moveTo(currentPos, wall.start.y);
              ctx.lineTo(doorPos - halfDoorWidth, wall.start.y);
            } else {
              ctx.moveTo(wall.start.x, currentPos);
              ctx.lineTo(wall.start.x, doorPos - halfDoorWidth);
            }
          }
          currentPos = doorPos + halfDoorWidth;
        });

        const endPos = wall.isHorizontal ? wall.end.x : wall.end.y;
        if (currentPos < endPos) {
          if (wall.isHorizontal) {
            ctx.moveTo(currentPos, wall.start.y);
            ctx.lineTo(endPos, wall.start.y);
          } else {
            ctx.moveTo(wall.start.x, currentPos);
            ctx.lineTo(wall.start.x, endPos);
          }
        }
      }
    });

    ctx.stroke();
  };

  const drawDoor = (ctx, door) => {
    ctx.beginPath();
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 5;

    const radius = doorWidth;

    if (door.orientation === "horizontal") {
      ctx.moveTo(door.x - doorWidth / 2, door.y);
      ctx.lineTo(door.x + doorWidth / 2, door.y);

      ctx.beginPath();
      ctx.arc(
        door.x + doorWidth / 2,
        door.y,
        radius,
        Math.PI,
        Math.PI * 1.5,
        false
      );
    } else {
      ctx.moveTo(door.x, door.y - doorWidth / 2);
      ctx.lineTo(door.x, door.y + doorWidth / 2);

      ctx.beginPath();
      ctx.arc(
        door.x,
        door.y + doorWidth / 2,
        radius,
        Math.PI * 1.5,
        Math.PI * 2,
        false
      );
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;

    if (door.orientation === "horizontal") {
      ctx.moveTo(door.x + doorWidth / 2, door.y);
      ctx.lineTo(door.x + doorWidth / 2, door.y - radius);
    } else {
      ctx.moveTo(door.x, door.y + doorWidth / 2);
      ctx.lineTo(door.x + radius, door.y + doorWidth / 2);
    }
    ctx.stroke();
  };

  const handleMouseDown = (e) => {
    if (selectedTool === "door") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snappedPoint = snapToNearestPoint(x, y);

    setIsDrawing(true);
    setCurrentRoom({
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snappedPoint = snapToNearestPoint(x, y);

    setCurrentRoom((prev) => ({
      ...prev,
      width: snappedPoint.x - prev.x,
      height: snappedPoint.y - prev.y,
    }));
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    if (
      currentRoom &&
      Math.abs(currentRoom.width) > gridSize &&
      Math.abs(currentRoom.height) > gridSize
    ) {
      const normalizedRoom = {
        x:
          currentRoom.width < 0
            ? currentRoom.x + currentRoom.width
            : currentRoom.x,
        y:
          currentRoom.height < 0
            ? currentRoom.y + currentRoom.height
            : currentRoom.y,
        width: Math.abs(currentRoom.width),
        height: Math.abs(currentRoom.height),
      };
      setRooms([...rooms, normalizedRoom]);
    }

    setIsDrawing(false);
    setCurrentRoom(null);
  };

  const handleCanvasClick = (e) => {
    if (selectedTool !== "door") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const intersection = findWallIntersection(x, y);
    if (intersection) {
      setDoors([
        ...doors,
        {
          x: intersection.x,
          y: intersection.y,
          orientation: intersection.orientation,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 p-4">
        <canvas
          ref={canvasRef}
          width={1880}
          height={750}
          className="bg-white border border-gray-300 shadow-sm cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        />
      </div>
      <div className="bg-white shadow-sm p-4 max-w-max mx-auto my-5 rounded-md">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md ${
              selectedTool === "room"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => setSelectedTool("room")}
          >
            <GiResize />
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              selectedTool === "door"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => setSelectedTool("door")}
          >
            <MdOutlineDoorFront />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomLayoutEditor;
