"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  calculateConcentration,
  WaterQualityData,
  COLOR_SCALES,
  getColorFromValue,
} from "@/lib/water-quality-calculations";
const RIVER_LENGTH = 8013;
const RIVER_POSITIONS = [
  { name: "Sài Đồng", position: 0 },
  { name: "Đài Tư", position: 1112 },
  { name: "An Lạc", position: 3170 },
  { name: "Trâu Quỳ", position: 4590 },
  { name: "Đa Tốn", position: 7070 },
  { name: "Xuân Thụy", position: 8013 },
];
interface RiverMapProps {
  width?: number;
  height?: number;
  rainfall: number;
  temperature: number;
  selectedParameter?: "BOD0" | "BOD1" | "NH40" | "NH41" | "NO3" | null;
  onPositionSelect?: (position: number, data: WaterQualityData) => void;
}
interface Coordinate {
  lat: number;
  lng: number;
}
const RiverMap: React.FC<RiverMapProps> = ({
  width = 650,
  height = 580,
  rainfall,
  temperature,
  selectedParameter = null,
  onPositionSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [hoveredCoordinate, setHoveredCoordinate] = useState<Coordinate | null>(
    null,
  );
  const [hoveredWaterQuality, setHoveredWaterQuality] =
    useState<WaterQualityData | null>(null);
  const [hoveredPositionMeters, setHoveredPositionMeters] = useState<number>(0);
  const generateBacHungHaiRiverPath = (): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const xuanThuyPoint = riverPoints[riverPoints.length - 1];
    const startX = 0;
    const endX = width;
    const riverY = xuanThuyPoint.y;
    const totalPoints = 60;
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const x = startX + (endX - startX) * t;
      let y = riverY;
      const naturalCurve = Math.sin(t * Math.PI * 2.2) * 8;
      y += naturalCurve;
      points.push({ x, y });
    }
    return points;
  };
  const generateCauBayRiverPath = (): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const totalLength = 8013;
    const riverSegments = [
      {
        start: 0,
        end: 1112,
        startX: 100,
        startY: 50,
        endX: 120,
        endY: 150,
        curve: "slight_right",
        intensity: 0.2,
      },
      {
        start: 1112,
        end: 3170,
        startX: 120,
        startY: 150,
        endX: 200,
        endY: 280,
        curve: "s_curve",
        intensity: 0.4,
      },
      {
        start: 3170,
        end: 4590,
        startX: 200,
        startY: 280,
        endX: 280,
        endY: 350,
        curve: "sharp_s",
        intensity: 0.8,
      },
      {
        start: 4590,
        end: 7070,
        startX: 280,
        startY: 350,
        endX: 450,
        endY: 420,
        curve: "complex_zigzag",
        intensity: 1.0,
      },
      {
        start: 7070,
        end: 8013,
        startX: 450,
        startY: 420,
        endX: 500,
        endY: 480,
        curve: "slight_left",
        intensity: 0.3,
      },
    ];
    riverSegments.forEach((segment, segmentIndex) => {
      const segmentLength = segment.end - segment.start;
      const segmentPoints = Math.floor((segmentLength / totalLength) * 300);
      for (let i = 0; i <= segmentPoints; i++) {
        const t = i / segmentPoints;
        const easeT = t * t * (3.0 - 2.0 * t);
        const baseX = segment.startX + (segment.endX - segment.startX) * easeT;
        const baseY = segment.startY + (segment.endY - segment.startY) * easeT;
        let offsetX = 0;
        let offsetY = 0;
        switch (segment.curve) {
          case "slight_right":
            offsetX =
              Math.sin(t * Math.PI * 0.8) *
              12 *
              segment.intensity *
              Math.sin(t * Math.PI);
            offsetY += Math.cos(t * Math.PI * 0.4) * 5 * segment.intensity;
            break;
          case "s_curve":
            const sPhase1 = Math.sin(t * Math.PI * 1.5) * Math.sin(t * Math.PI);
            const sPhase2 = Math.cos(t * Math.PI * 1.2) * Math.sin(t * Math.PI);
            offsetX = sPhase1 * 22 * segment.intensity;
            offsetY += sPhase2 * 8 * segment.intensity;
            break;
          case "sharp_s":
            const sharpS1 =
              Math.sin(t * Math.PI * 2) * Math.pow(Math.sin(t * Math.PI), 0.5);
            const sharpS2 = Math.sin(t * Math.PI * 3) * Math.sin(t * Math.PI);
            offsetX = sharpS1 * 35 * segment.intensity;
            offsetY += sharpS2 * 12 * segment.intensity;
            break;
          case "complex_zigzag":
            const harmonic1 =
              Math.sin(t * Math.PI * 2.5) * Math.sin(t * Math.PI);
            const harmonic2 =
              Math.sin(t * Math.PI * 1.2) * Math.sin(t * Math.PI);
            const harmonic3 =
              Math.cos(t * Math.PI * 0.8) * Math.sin(t * Math.PI);
            offsetX = (harmonic1 * 25 + harmonic2 * 45) * segment.intensity;
            offsetY += (harmonic3 * 20 + harmonic1 * 10) * segment.intensity;
            break;
          case "slight_left":
            offsetX =
              -Math.sin(t * Math.PI * 0.9) *
              15 *
              segment.intensity *
              Math.sin(t * Math.PI);
            offsetY += Math.cos(t * Math.PI * 0.6) * 6 * segment.intensity;
            break;
        }
        const smoothFactor = Math.sin(t * Math.PI);
        const naturalNoiseX = Math.sin(t * Math.PI * 15 + segmentIndex) * 1.5;
        const naturalNoiseY = Math.cos(t * Math.PI * 12 + segmentIndex) * 1;
        points.push({
          x: baseX + offsetX * smoothFactor + naturalNoiseX,
          y: baseY + offsetY * smoothFactor + naturalNoiseY,
        });
      }
    });
    return points;
  };
  const riverPoints = generateCauBayRiverPath();
  const bacHungHaiRiverPoints = generateBacHungHaiRiverPath();
  const pixelToCoordinate = (x: number, y: number): Coordinate => {
    const progressX = x / width;
    const progressY = y / height;
    const startLat = 21.032323;
    const startLng = 105.919651;
    const endLat = 20.998456;
    const endLng = 105.952567;
    const lat = startLat + (endLat - startLat) * progressY;
    const lng = startLng + (endLng - startLng) * progressX;
    return { lat, lng };
  };
  const isPointOnRiver = (x: number, y: number): boolean => {
    const cauBayWidth = 48;
    const bacHungHaiWidth = 55;
    let minCauBayDistance = Infinity;
    for (const point of riverPoints) {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2),
      );
      if (distance < minCauBayDistance) {
        minCauBayDistance = distance;
      }
    }
    let minBacHungHaiDistance = Infinity;
    for (const point of bacHungHaiRiverPoints) {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2),
      );
      if (distance < minBacHungHaiDistance) {
        minBacHungHaiDistance = distance;
      }
    }
    return (
      minCauBayDistance <= cauBayWidth / 2 ||
      minBacHungHaiDistance <= bacHungHaiWidth / 2
    );
  };
  const isPointOnCauBayRiver = (x: number, y: number): boolean => {
    const cauBayWidth = 48;
    let minCauBayDistance = Infinity;
    for (const point of riverPoints) {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2),
      );
      if (distance < minCauBayDistance) {
        minCauBayDistance = distance;
      }
    }
    return minCauBayDistance <= cauBayWidth / 2;
  };
  const drawSecondaryRivers = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.strokeStyle = "#20b2aa";
    ctx.lineWidth = 45;
    if (bacHungHaiRiverPoints.length > 0) {
      ctx.moveTo(bacHungHaiRiverPoints[0].x, bacHungHaiRiverPoints[0].y);
      for (let i = 1; i < bacHungHaiRiverPoints.length - 1; i++) {
        const currentPoint = bacHungHaiRiverPoints[i];
        const nextPoint = bacHungHaiRiverPoints[i + 1];
        const controlX = (currentPoint.x + nextPoint.x) / 2;
        const controlY = (currentPoint.y + nextPoint.y) / 2;
        ctx.quadraticCurveTo(
          currentPoint.x,
          currentPoint.y,
          controlX,
          controlY,
        );
      }
      const lastPoint = bacHungHaiRiverPoints[bacHungHaiRiverPoints.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }
    ctx.stroke();
    const xuanThuyPoint = riverPoints[riverPoints.length - 1];
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(32, 178, 170, 0.4)";
    ctx.arc(xuanThuyPoint.x, xuanThuyPoint.y, 35, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "#20b2aa";
    ctx.lineWidth = 3;
    ctx.arc(xuanThuyPoint.x, xuanThuyPoint.y, 35, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    const midBacHungHai =
      bacHungHaiRiverPoints[Math.floor(bacHungHaiRiverPoints.length / 2)];
    ctx.fillStyle = "#1a5f5f";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SÔNG BẮC HƯNG HẢI", midBacHungHai.x, midBacHungHai.y - 30);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#20b2aa";
    ctx.fillText("(Sông chính)", midBacHungHai.x, midBacHungHai.y - 15);
  };
  const drawLandscape = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#f4e8d0";
    ctx.fillRect(0, 0, width, height);
    drawLandPatches(ctx);
  };
  const drawLandPatches = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#d4f4dd";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.1);
    ctx.bezierCurveTo(
      width * 0.15,
      height * 0.05,
      width * 0.25,
      height * 0.2,
      width * 0.35,
      height * 0.15,
    );
    ctx.bezierCurveTo(
      width * 0.4,
      height * 0.25,
      width * 0.3,
      height * 0.4,
      width * 0.2,
      height * 0.45,
    );
    ctx.bezierCurveTo(
      width * 0.1,
      height * 0.5,
      0,
      height * 0.4,
      0,
      height * 0.1,
    );
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.7, height * 0.6);
    ctx.bezierCurveTo(
      width * 0.75,
      height * 0.55,
      width * 0.85,
      height * 0.65,
      width * 0.9,
      height * 0.7,
    );
    ctx.bezierCurveTo(
      width * 0.95,
      height * 0.8,
      width,
      height * 0.85,
      width,
      height,
    );
    ctx.lineTo(width * 0.65, height);
    ctx.bezierCurveTo(
      width * 0.68,
      height * 0.75,
      width * 0.7,
      height * 0.65,
      width * 0.7,
      height * 0.6,
    );
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e8e8e8";
    ctx.beginPath();
    ctx.moveTo(width * 0.05, height * 0.75);
    ctx.bezierCurveTo(
      width * 0.1,
      height * 0.7,
      width * 0.2,
      height * 0.72,
      width * 0.3,
      height * 0.75,
    );
    ctx.bezierCurveTo(
      width * 0.35,
      height * 0.85,
      width * 0.25,
      height * 0.95,
      width * 0.15,
      height,
    );
    ctx.lineTo(0, height);
    ctx.lineTo(0, height * 0.8);
    ctx.bezierCurveTo(
      width * 0.02,
      height * 0.78,
      width * 0.05,
      height * 0.75,
      width * 0.05,
      height * 0.75,
    );
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.6, height * 0.05);
    ctx.bezierCurveTo(
      width * 0.7,
      0,
      width * 0.85,
      height * 0.02,
      width,
      height * 0.1,
    );
    ctx.lineTo(width, height * 0.35);
    ctx.bezierCurveTo(
      width * 0.9,
      height * 0.3,
      width * 0.75,
      height * 0.25,
      width * 0.65,
      height * 0.3,
    );
    ctx.bezierCurveTo(
      width * 0.6,
      height * 0.2,
      width * 0.58,
      height * 0.1,
      width * 0.6,
      height * 0.05,
    );
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d2b48c";
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.02);
    ctx.bezierCurveTo(
      width * 0.45,
      0,
      width * 0.55,
      height * 0.05,
      width * 0.6,
      height * 0.08,
    );
    ctx.bezierCurveTo(
      width * 0.58,
      height * 0.15,
      width * 0.5,
      height * 0.18,
      width * 0.4,
      height * 0.15,
    );
    ctx.bezierCurveTo(
      width * 0.35,
      height * 0.12,
      width * 0.33,
      height * 0.07,
      width * 0.35,
      height * 0.02,
    );
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(139, 69, 19, 0.08)";
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      if (!isPointOnRiver(x, y)) {
        const gradient = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          Math.random() * 3 + 1,
        );
        gradient.addColorStop(0, "rgba(139, 69, 19, 0.15)");
        gradient.addColorStop(1, "rgba(139, 69, 19, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 3 + 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };
  const drawRiver = (ctx: CanvasRenderingContext2D) => {
    drawLandscape(ctx);
    drawSecondaryRivers(ctx);
    if (selectedParameter) {
      console.log('🎨 Drawing heatmap for parameter:', selectedParameter);
      drawHeatmap(ctx);
    } else {
      ctx.beginPath();
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 45;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (riverPoints.length > 0) {
        ctx.moveTo(riverPoints[0].x, riverPoints[0].y);
        for (let i = 1; i < riverPoints.length - 1; i++) {
          const currentPoint = riverPoints[i];
          const nextPoint = riverPoints[i + 1];
          const controlX = (currentPoint.x + nextPoint.x) / 2;
          const controlY = (currentPoint.y + nextPoint.y) / 2;
          ctx.quadraticCurveTo(
            currentPoint.x,
            currentPoint.y,
            controlX,
            controlY,
          );
        }
        const lastPoint = riverPoints[riverPoints.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }
      ctx.stroke();
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      if (riverPoints.length > 0) {
        ctx.moveTo(riverPoints[0].x, riverPoints[0].y);
        for (let i = 1; i < riverPoints.length - 1; i++) {
          const currentPoint = riverPoints[i];
          const nextPoint = riverPoints[i + 1];
          const controlX = (currentPoint.x + nextPoint.x) / 2;
          const controlY = (currentPoint.y + nextPoint.y) / 2;
          ctx.quadraticCurveTo(
            currentPoint.x,
            currentPoint.y,
            controlX,
            controlY,
          );
        }
        const lastPoint = riverPoints[riverPoints.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(135, 206, 250, 0.4)";
      ctx.lineWidth = 15;
      if (riverPoints.length > 0) {
        ctx.moveTo(riverPoints[0].x, riverPoints[0].y);
        for (let i = 1; i < riverPoints.length - 1; i++) {
          const currentPoint = riverPoints[i];
          const nextPoint = riverPoints[i + 1];
          const controlX = (currentPoint.x + nextPoint.x) / 2;
          const controlY = (currentPoint.y + nextPoint.y) / 2;
          ctx.quadraticCurveTo(
            currentPoint.x,
            currentPoint.y,
            controlX,
            controlY,
          );
        }
        const lastPoint = riverPoints[riverPoints.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }
      ctx.stroke();
    }
    RIVER_POSITIONS.forEach((position, index) => {
      const progress = position.position / RIVER_LENGTH;
      const targetIndex = Math.round(progress * (riverPoints.length - 1));
      const riverPoint =
        riverPoints[Math.min(targetIndex, riverPoints.length - 1)];
      if (riverPoint) {
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(riverPoint.x, riverPoint.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#333333";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        let textY = riverPoint.y - 25;
        let textX = riverPoint.x;
        switch (index) {
          case 0:
            textY = riverPoint.y - 35;
            textX = riverPoint.x - 30;
            break;
          case 1:
            textY = riverPoint.y - 35;
            textX = riverPoint.x + 30;
            break;
          case 2:
            textY = riverPoint.y;
            textX = riverPoint.x - 45;
            break;
          case 3:
            textY = riverPoint.y;
            textX = riverPoint.x + 45;
            break;
          case 4:
            textY = riverPoint.y + 45;
            textX = riverPoint.x - 30;
            break;
          case 5:
            textY = riverPoint.y + 45;
            textX = riverPoint.x + 30;
            break;
        }
        if (index === 0) {
          textY = riverPoint.y - 35;
          textX = riverPoint.x - 30;
        } else if (index === RIVER_POSITIONS.length - 1) {
          textY = riverPoint.y + 45;
          textX = riverPoint.x + 30;
        }
        ctx.fillText(position.name, textX, textY);
        ctx.font = "12px Arial";
        ctx.fillStyle = "#666666";
        ctx.fillText(
          `${position.position.toLocaleString()}m`,
          textX,
          textY + 15,
        );
      }
    });
    if (selectedPosition !== null) {
      const progress = selectedPosition / RIVER_LENGTH;
      const targetIndex = Math.round(progress * (riverPoints.length - 1));
      const riverPoint =
        riverPoints[Math.min(targetIndex, riverPoints.length - 1)];
      if (riverPoint) {
        ctx.fillStyle = "#ff6b35";
        ctx.beginPath();
        ctx.arc(riverPoint.x, riverPoint.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  };
  // Calculate dynamic min/max values for the selected parameter
  const calculateParameterRange = (parameter: 'BOD0' | 'BOD1' | 'NH40' | 'NH41' | 'NO3') => {
    let minValue = Infinity;
    let maxValue = -Infinity;
    const sampleValues: number[] = [];
    
    // Sample positions along the river to find actual min/max - use 80 samples for consistency
    for (let i = 0; i <= 80; i++) {
      const progress = i / 80;
      const positionMeters = progress * RIVER_LENGTH;
      const waterQuality = calculateConcentration(positionMeters, rainfall, temperature);
      
      let value = 0;
      switch (parameter) {
        case 'BOD0':
          value = waterQuality.BOD5_sample0;
          break;
        case 'BOD1':
          value = waterQuality.BOD5_sample1;
          break;
        case 'NH40':
          value = waterQuality.NH4_sample0;
          break;
        case 'NH41':
          value = waterQuality.NH4_sample1;
          break;
        case 'NO3':
          value = waterQuality.NO3_sample1;
          break;
      }
      
      sampleValues.push(value);
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }
    
    console.log(`📈 Parameter ${parameter} range: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)}`);
    console.log(`📊 Sample values:`, sampleValues.slice(0, 10).map(v => v.toFixed(2))); // First 10 values
    
    return { min: minValue, max: maxValue };
  };

  const drawHeatmap = (ctx: CanvasRenderingContext2D) => {
    if (!selectedParameter) return;
    console.log('🔥 Drawing heatmap for parameter:', selectedParameter);
    const heatmapSegments = 150; // More segments for smoother gradient
    
    // Calculate dynamic range for the selected parameter
    const parameterRange = calculateParameterRange(selectedParameter);
    console.log('📊 Parameter range:', parameterRange);
    
    // Vẽ nền sông trước với màu nhạt hơn
    ctx.beginPath();
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 50; // Wider background
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (riverPoints.length > 0) {
      ctx.moveTo(riverPoints[0].x, riverPoints[0].y);
      for (let i = 1; i < riverPoints.length - 1; i++) {
        const currentPoint = riverPoints[i];
        const nextPoint = riverPoints[i + 1];
        const controlX = (currentPoint.x + nextPoint.x) / 2;
        const controlY = (currentPoint.y + nextPoint.y) / 2;
        ctx.quadraticCurveTo(
          currentPoint.x,
          currentPoint.y,
          controlX,
          controlY,
        );
      }
      const lastPoint = riverPoints[riverPoints.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }
    ctx.stroke();
    for (let i = 0; i < heatmapSegments; i++) {
      const progress = i / heatmapSegments;
      const nextProgress = (i + 1) / heatmapSegments;
      const positionMeters = progress * RIVER_LENGTH;
      const waterQuality = calculateConcentration(
        positionMeters,
        rainfall,
        temperature,
      );
      // Get value based on selected parameter
      let value = 0;
      switch (selectedParameter) {
        case "BOD0":
          value = waterQuality.BOD5_sample0;
          break;
        case "BOD1":
          value = waterQuality.BOD5_sample1;
          break;
        case "NH40":
          value = waterQuality.NH4_sample0;
          break;
        case "NH41":
          value = waterQuality.NH4_sample1;
          break;
        case "NO3":
          value = waterQuality.NO3_sample1;
          break;
      }
      
      // Use standardized color calculation with dynamic range
      const dynamicColorScale = {
        min: parameterRange.min,
        max: parameterRange.max,
        colors: selectedParameter === 'BOD0' || selectedParameter === 'BOD1' 
          ? ["white", "lightpink", "red"]
          : selectedParameter === 'NH40' || selectedParameter === 'NH41'
          ? ["white", "lightyellow", "gold"]
          : selectedParameter === 'NO3'
          ? ["white", "lightblue", "deepskyblue"]
          : ["white", "lightpink", "red"] // default
      };
      
      const color = getColorFromValue(value, dynamicColorScale);
      const currentRiverIndex = Math.floor(progress * (riverPoints.length - 1));
      const nextRiverIndex = Math.floor(
        nextProgress * (riverPoints.length - 1),
      );
      const currentPoint = riverPoints[currentRiverIndex];
      const nextPoint =
        riverPoints[Math.min(nextRiverIndex, riverPoints.length - 1)];
      if (currentPoint && nextPoint) {
        // Debug log để kiểm tra màu sắc
        if (i % 30 === 0) {
          console.log(`🎨 Heatmap Debug - Position: ${positionMeters.toFixed(0)}m, ${selectedParameter}: ${value.toFixed(2)}, Range: ${parameterRange.min.toFixed(2)}-${parameterRange.max.toFixed(2)}, Color: ${color}`);
        }
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 45; // Make heatmap lines thicker for better visibility
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
      }
    }
  };
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x, y });
    if (isPointOnCauBayRiver(x, y)) {
      let closestProgress = 0;
      let minDistance = Infinity;
      riverPoints.forEach((point, index) => {
        const distance = Math.sqrt(
          Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestProgress = index / (riverPoints.length - 1);
        }
      });
      const positionMeters = closestProgress * RIVER_LENGTH;
      const coordinate = pixelToCoordinate(x, y);
      const waterQuality = calculateConcentration(
        positionMeters,
        rainfall,
        temperature,
      );
      setHoveredCoordinate(coordinate);
      setHoveredWaterQuality(waterQuality);
      setHoveredPositionMeters(positionMeters);
    } else {
      setHoveredCoordinate(null);
      setHoveredWaterQuality(null);
    }
  };
  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredCoordinate(null);
    setHoveredWaterQuality(null);
  };
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (isPointOnCauBayRiver(x, y)) {
      let closestProgress = 0;
      let minDistance = Infinity;
      riverPoints.forEach((point, index) => {
        const distance = Math.sqrt(
          Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestProgress = index / (riverPoints.length - 1);
        }
      });
      const positionMeters = closestProgress * RIVER_LENGTH;
      const waterQuality = calculateConcentration(
        positionMeters,
        rainfall,
        temperature,
      );
      setSelectedPosition(positionMeters);
      if (onPositionSelect) {
        onPositionSelect(positionMeters, waterQuality);
      }
    }
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawRiver(ctx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    selectedParameter,
    selectedPosition,
    rainfall,
    temperature,
  ]);
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {}
      {mousePosition && hoveredWaterQuality && hoveredCoordinate && (
        <div
          className="absolute bg-black text-white px-4 py-3 rounded-lg shadow-lg text-xs pointer-events-none z-10 max-w-xs"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
          }}
        >
          <div className="font-bold mb-2">
            Vị trí: {hoveredPositionMeters.toFixed(0)}m
          </div>
          <div className="space-y-1">
            <div>
              BOD5 (mẫu 0): {hoveredWaterQuality.BOD5_sample0.toFixed(2)} mg/L
            </div>
            <div>
              BOD5 (mẫu 1): {hoveredWaterQuality.BOD5_sample1.toFixed(2)} mg/L
            </div>
            <div>
              NH4+ (mẫu 0): {hoveredWaterQuality.NH4_sample0.toFixed(2)} mg/L
            </div>
            <div>
              NH4+ (mẫu 1): {hoveredWaterQuality.NH4_sample1.toFixed(2)} mg/L
            </div>
            <div>
              NO3- (mẫu 1): {hoveredWaterQuality.NO3_sample1.toFixed(2)} mg/L
            </div>
          </div>
          {hoveredCoordinate && (
            <div className="mt-2 pt-2 border-t border-gray-600 text-gray-300">
              <div>Vĩ độ: {hoveredCoordinate.lat.toFixed(6)}°</div>
              <div>Kinh độ: {hoveredCoordinate.lng.toFixed(6)}°</div>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Hệ thống sông Cầu Bây:</strong>
        </p>
        <p>
          • <strong>Sông Cầu Bây</strong> (chính):{" "}
          {RIVER_LENGTH.toLocaleString()}m - từ Sài Đồng đến Xuân Thụy
        </p>
        <p>
          • <strong>Sông Bắc Hưng Hải</strong> (phụ): Phía Nam, chảy Đông-Tây,
          tiếp nhận sông Cầu Bây tại Xuân Thụy
        </p>
        <hr className="my-2 border-gray-300" />
        <p>• Lượng mưa hiện tại: {rainfall} mm/hr</p>
        <p>• Nhiệt độ hiện tại: {temperature}°C</p>
        <p>
          • Chỉ có thể click và hover trên sông Cầu Bây để xem dữ liệu chất
          lượng nước
        </p>
        {selectedParameter && (
          <div>
            <p>
              • Heatmap hiện tại: <strong>{selectedParameter}</strong>
            </p>
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">Thang màu {selectedParameter}:</p>
              <div className="flex items-center gap-1">
                {selectedParameter.startsWith('BOD') ? (
                  <>
                    <div className="w-4 h-4 bg-green-400 border border-gray-300"></div>
                    <span className="text-xs">Thấp</span>
                    <div className="w-4 h-4 bg-yellow-400 border border-gray-300"></div>
                    <span className="text-xs">TB</span>
                    <div className="w-4 h-4 bg-orange-400 border border-gray-300"></div>
                    <div className="w-4 h-4 bg-red-500 border border-gray-300"></div>
                    <span className="text-xs">Cao</span>
                  </>
                ) : selectedParameter.startsWith('NH4') ? (
                  <>
                    <div className="w-4 h-4 bg-blue-400 border border-gray-300"></div>
                    <span className="text-xs">Thấp</span>
                    <div className="w-4 h-4 bg-cyan-300 border border-gray-300"></div>
                    <div className="w-4 h-4 bg-yellow-300 border border-gray-300"></div>
                    <div className="w-4 h-4 bg-yellow-500 border border-gray-300"></div>
                    <span className="text-xs">Cao</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-blue-100 border border-gray-300"></div>
                    <span className="text-xs">Thấp</span>
                    <div className="w-4 h-4 bg-blue-300 border border-gray-300"></div>
                    <div className="w-4 h-4 bg-blue-500 border border-gray-300"></div>
                    <div className="w-4 h-4 bg-blue-700 border border-gray-300"></div>
                    <span className="text-xs">Cao</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {selectedPosition !== null && (
          <p>
            • Vị trí được chọn: <strong>{selectedPosition.toFixed(0)}m</strong>
          </p>
        )}
      </div>
    </div>
  );
};
export default RiverMap;
