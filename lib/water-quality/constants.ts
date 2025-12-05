import { RiverPosition } from './types';

export const RIVER_POSITIONS: RiverPosition[] = [
  { name: "Sài Đồng", position: 0 },
  { name: "Đài Tư", position: 1112 },
  { name: "An Lạc", position: 3170 },
  { name: "Trâu Quỳ", position: 4590 },
  { name: "Đa Tốn", position: 7070 },
  { name: "Xuân Thụy", position: 8013 },
];

// Danh sách các điểm quan trọng luôn cần hiển thị (bao gồm trước và sau cống)
export const CRITICAL_POSITIONS: number[] = [
  0,     // Sài Đồng
  1110,  // Trước Đài Tư 2m
  1112,  // Đài Tư (giữa cống)
  1114,  // Sau Đài Tư 2m
  3168,  // Trước An Lạc 2m  
  3170,  // An Lạc (giữa cống)
  3172,  // Sau An Lạc 2m
  4588,  // Trước Trâu Quỳ 2m
  4590,  // Trâu Quỳ (giữa cống)
  4592,  // Sau Trâu Quỳ 2m
  7068,  // Trước Đa Tốn 2m
  7070,  // Đa Tốn (giữa cống)
  7072,  // Sau Đa Tốn 2m
  8013,  // Xuân Thụy
];

export const RIVER_LENGTH = 8013;