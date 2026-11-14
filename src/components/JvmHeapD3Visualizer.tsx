import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  HardDrive,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Cpu,
  Info,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Activity,
  Box,
} from 'lucide-react';
import { ExecutionSnapshot, HeapArray, HeapObject, JvmValue } from '../jvm/types';

interface JvmHeapD3VisualizerProps {
  snapshot: ExecutionSnapshot;
  className?: string;
  isExpandedDefault?: boolean;
}

interface RootRef {
  id: string;
  sourceType: 'LVT' | 'Stack';
  sourceName: string;
  targetAddress: number;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'lvt_root' | 'stack_root' | 'heap_array' | 'heap_object';
  title: string;
  subtitle: string;
  address?: number;
  arrayData?: HeapArray;
  objectData?: HeapObject;
  byteSize?: number;
  isReferenced?: boolean;
  width?: number;
  height?: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
  type: 'lvt_ref' | 'stack_ref' | 'field_ref';
  label?: string;
}

export const JvmHeapD3Visualizer: React.FC<JvmHeapD3VisualizerProps> = ({
  snapshot,
  className = '',
  isExpandedDefault = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'topology' | 'memoryMap'>('topology');
  const [isFullscreen, setIsFullscreen] = useState(isExpandedDefault);
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Extract all active reference roots from LVT and Stack
  const roots = useMemo(() => {
    const list: RootRef[] = [];

    // Local Variable Table roots
    snapshot.localVariables.forEach((val, idx) => {
      if (val && val.type === 'REFERENCE' && val.value > 0) {
        list.push({
          id: `lvt_${idx}_${val.value}`,
          sourceType: 'LVT',
          sourceName: `LVT[${idx}]`,
          targetAddress: val.value,
        });
      }
    });

    // Operand Stack roots
    snapshot.operandStack.forEach((val, idx) => {
      if (val && val.type === 'REFERENCE' && val.value > 0) {
        list.push({
          id: `stack_${idx}_${val.value}`,
          sourceType: 'Stack',
          sourceName: `Stack[${idx}]`,
          targetAddress: val.value,
        });
      }
    });

    return list;
  }, [snapshot.localVariables, snapshot.operandStack]);

  // Total allocated heap bytes (HotSpot layout: 12B array header + elements * 4B, 8-byte aligned)
  const heapMetrics = useMemo(() => {
    let totalBytes = 0;
    const arrayCount = snapshot.heapArrays.length;
    const objectCount = snapshot.heapObjects.length;

    snapshot.heapArrays.forEach((a) => {
      const raw = 16 + a.length * 4;
      const aligned = Math.ceil(raw / 8) * 8;
      totalBytes += aligned;
    });

    snapshot.heapObjects.forEach(() => {
      totalBytes += 24; // 16B header + fields, aligned
    });

    const referencedAddresses = new Set(roots.map((r) => r.targetAddress));
    const liveObjects = snapshot.heapArrays.filter((a) => referencedAddresses.has(a.address)).length +
      snapshot.heapObjects.filter((o) => referencedAddresses.has(o.address)).length;

    return {
      totalBytes,
      arrayCount,
      objectCount,
      liveObjects,
      totalCount: arrayCount + objectCount,
      freeVirtualSpace: Math.max(0, 4096 - totalBytes),
    };
  }, [snapshot.heapArrays, snapshot.heapObjects, roots]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const availableHeight = containerRef.current.clientHeight ? containerRef.current.clientHeight - 85 : 0;
    const height = isFullscreen
      ? (containerRef.current.clientHeight || 500)
      : Math.max(340, availableHeight || 340);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    // Setup Defs (Markers, Gradients, Shadows)
    const defs = svg.append('defs');

    // Arrowhead marker for LVT
    defs
      .append('marker')
      .attr('id', 'arrow-lvt')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 1 L 9 5 L 0 9 z')
      .attr('fill', '#06b6d4');

    // Arrowhead marker for Stack
    defs
      .append('marker')
      .attr('id', 'arrow-stack')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 1 L 9 5 L 0 9 z')
      .attr('fill', '#a855f7');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Zoom container
    const g = svg.append('g').attr('class', 'main-viewport');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    svg.call(zoom);

    if (viewMode === 'topology') {
      renderTopologyGraph(g, width, height);
    } else {
      renderMemoryAddressMap(g, width, height);
    }
  }, [snapshot, viewMode, isFullscreen, roots]);

  // Render D3 Interactive Node-Link Reference Graph
  const renderTopologyGraph = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const nodes: D3Node[] = [];
    const links: D3Link[] = [];

    const rootTargetAddresses = new Set(roots.map((r) => r.targetAddress));

    // 1. Add Stack and LVT Root Nodes
    roots.forEach((root, idx) => {
      const isLvt = root.sourceType === 'LVT';
      nodes.push({
        id: root.id,
        type: isLvt ? 'lvt_root' : 'stack_root',
        title: root.sourceName,
        subtitle: `-> 0x${root.targetAddress.toString(16).toUpperCase()}`,
        address: root.targetAddress,
        width: 110,
        height: 38,
        x: 80,
        y: 60 + idx * 56,
      });

      links.push({
        id: `link_${root.id}`,
        source: root.id,
        target: `heap_${root.targetAddress}`,
        type: isLvt ? 'lvt_ref' : 'stack_ref',
        label: root.sourceName,
      });
    });

    // 2. Add Heap Array Nodes
    snapshot.heapArrays.forEach((arr, idx) => {
      const rawBytes = 16 + arr.length * 4;
      const alignedBytes = Math.ceil(rawBytes / 8) * 8;
      const cardWidth = Math.max(180, Math.min(320, 100 + arr.elements.length * 28));

      nodes.push({
        id: `heap_${arr.address}`,
        type: 'heap_array',
        title: `int[${arr.length}]`,
        subtitle: `@0x${arr.address.toString(16).toUpperCase()}`,
        address: arr.address,
        arrayData: arr,
        byteSize: alignedBytes,
        isReferenced: rootTargetAddresses.has(arr.address),
        width: cardWidth,
        height: 82,
        x: Math.max(280, width * 0.55),
        y: 60 + idx * 105,
      });
    });

    // 3. Add Heap Object Nodes
    snapshot.heapObjects.forEach((obj, idx) => {
      nodes.push({
        id: `heap_${obj.address}`,
        type: 'heap_object',
        title: obj.className,
        subtitle: `@0x${obj.address.toString(16).toUpperCase()}`,
        address: obj.address,
        objectData: obj,
        byteSize: 24,
        isReferenced: rootTargetAddresses.has(obj.address),
        width: 180,
        height: 70,
        x: Math.max(280, width * 0.55),
        y: 60 + (snapshot.heapArrays.length + idx) * 95,
      });
    });

    if (nodes.length === 0) {
      // Empty state watermark
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .attr('font-family', 'monospace')
        .text('No active heap allocations. Execute bytecode to allocate memory.');
      return;
    }

    // Draw Links (Curved Beziers)
    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Link paths
    const linkPaths = linkGroup
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('stroke', (d) => (d.type === 'lvt_ref' ? '#06b6d4' : '#a855f7'))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '4,3')
      .attr('marker-end', (d) => (d.type === 'lvt_ref' ? 'url(#arrow-lvt)' : 'url(#arrow-stack)'))
      .attr('d', (d) => {
        const sourceNode = nodes.find((n) => n.id === d.source);
        const targetNode = nodes.find((n) => n.id === d.target);
        if (!sourceNode || !targetNode) return '';

        const sx = (sourceNode.x || 0) + (sourceNode.width || 100);
        const sy = (sourceNode.y || 0) + (sourceNode.height || 40) / 2;
        const tx = targetNode.x || 0;
        const ty = (targetNode.y || 0) + 20;

        const dx = tx - sx;
        const cx1 = sx + dx * 0.5;
        const cy1 = sy;
        const cx2 = sx + dx * 0.5;
        const cy2 = ty;

        return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
      });

    // Animate link dashes
    linkPaths
      .append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('values', '28;0')
      .attr('dur', '1.5s')
      .attr('repeatCount', 'indefinite');

    // Draw Nodes
    const nodeEnter = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`)
      .attr('cursor', 'pointer')
      .on('click', (_, d) => {
        setSelectedNode(d);
      });

    // Node drag behavior
    const drag = d3
      .drag<SVGGElement, D3Node>()
      .on('drag', (event, d) => {
        d.x = event.x;
        d.y = event.y;
        d3.select(event.sourceEvent.currentTarget).attr('transform', `translate(${d.x}, ${d.y})`);

        // Update links
        linkPaths.attr('d', (l) => {
          const sNode = nodes.find((n) => n.id === l.source);
          const tNode = nodes.find((n) => n.id === l.target);
          if (!sNode || !tNode) return '';
          const sx = (sNode.x || 0) + (sNode.width || 100);
          const sy = (sNode.y || 0) + (sNode.height || 40) / 2;
          const tx = tNode.x || 0;
          const ty = (tNode.y || 0) + 20;
          const dx = tx - sx;
          return `M ${sx} ${sy} C ${sx + dx * 0.5} ${sy}, ${sx + dx * 0.5} ${ty}, ${tx} ${ty}`;
        });
      });

    nodeEnter.call(drag as any);

    // Render node shapes based on type
    nodeEnter.each(function (d) {
      const el = d3.select(this);

      if (d.type === 'lvt_root' || d.type === 'stack_root') {
        // Root pill
        const isLvt = d.type === 'lvt_root';
        const color = isLvt ? '#06b6d4' : '#a855f7';
        const bgColor = isLvt ? 'rgba(6, 182, 212, 0.12)' : 'rgba(168, 85, 247, 0.12)';

        el.append('rect')
          .attr('width', d.width || 110)
          .attr('height', d.height || 38)
          .attr('rx', 6)
          .attr('fill', bgColor)
          .attr('stroke', color)
          .attr('stroke-width', 1.5);

        // Header icon dot
        el.append('circle')
          .attr('cx', 12)
          .attr('cy', 14)
          .attr('r', 3.5)
          .attr('fill', color);

        // Source Name
        el.append('text')
          .attr('x', 22)
          .attr('y', 17)
          .attr('fill', '#f1f5f9')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(d.title);

        // Target pointer
        el.append('text')
          .attr('x', 22)
          .attr('y', 30)
          .attr('fill', color)
          .attr('font-size', '9.5px')
          .attr('font-family', 'monospace')
          .text(d.subtitle);
      } else if (d.type === 'heap_array' && d.arrayData) {
        // Heap Array Card
        const arr = d.arrayData;
        const w = d.width || 220;
        const h = d.height || 82;

        // Card background
        el.append('rect')
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 8)
          .attr('fill', '#020617')
          .attr('stroke', d.isReferenced ? '#ec4899' : '#64748b')
          .attr('stroke-width', d.isReferenced ? 1.5 : 1)
          .attr('filter', d.isReferenced ? 'url(#glow)' : null);

        // Card Header Bar
        el.append('path')
          .attr('d', `M 0 8 Q 0 0 8 0 L ${w - 8} 0 Q ${w} 0 ${w} 8 L ${w} 24 L 0 24 Z`)
          .attr('fill', 'rgba(236, 72, 153, 0.15)');

        // Type label
        el.append('text')
          .attr('x', 10)
          .attr('y', 16)
          .attr('fill', '#f472b6')
          .attr('font-size', '10.5px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(`int[${arr.length}] Array`);

        // Address badge
        el.append('text')
          .attr('x', w - 10)
          .attr('y', 16)
          .attr('text-anchor', 'end')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .text(`0x${arr.address.toString(16).toUpperCase()}`);

        // Memory byte info
        el.append('text')
          .attr('x', 10)
          .attr('y', 36)
          .attr('fill', '#64748b')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .text(`Size: ${d.byteSize}B (16B hdr + ${arr.length * 4}B data)`);

        // Render array elements grid
        const elementsGroup = el.append('g').attr('transform', 'translate(10, 42)');
        const maxDisplay = 8;
        const displayCount = Math.min(arr.elements.length, maxDisplay);

        for (let i = 0; i < displayCount; i++) {
          const cellX = i * 26;
          const val = arr.elements[i];

          // Element box
          elementsGroup
            .append('rect')
            .attr('x', cellX)
            .attr('y', 0)
            .attr('width', 24)
            .attr('height', 30)
            .attr('rx', 3)
            .attr('fill', '#0f172a')
            .attr('stroke', '#334155')
            .attr('stroke-width', 1);

          // Element index
          elementsGroup
            .append('text')
            .attr('x', cellX + 12)
            .attr('y', 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '8px')
            .attr('font-family', 'monospace')
            .text(`[${i}]`);

          // Element value
          elementsGroup
            .append('text')
            .attr('x', cellX + 12)
            .attr('y', 23)
            .attr('text-anchor', 'middle')
            .attr('fill', '#f1f5f9')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'monospace')
            .text(val);
        }

        if (arr.elements.length > maxDisplay) {
          elementsGroup
            .append('text')
            .attr('x', maxDisplay * 26 + 6)
            .attr('y', 18)
            .attr('fill', '#64748b')
            .attr('font-size', '10px')
            .attr('font-family', 'monospace')
            .text(`+${arr.elements.length - maxDisplay}`);
        }
      } else if (d.type === 'heap_object') {
        // Heap Object Instance Card
        const w = d.width || 180;
        const h = d.height || 70;

        el.append('rect')
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 8)
          .attr('fill', '#020617')
          .attr('stroke', d.isReferenced ? '#f59e0b' : '#64748b')
          .attr('stroke-width', d.isReferenced ? 1.5 : 1);

        el.append('text')
          .attr('x', 10)
          .attr('y', 18)
          .attr('fill', '#fbbf24')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(d.title);

        el.append('text')
          .attr('x', w - 10)
          .attr('y', 18)
          .attr('text-anchor', 'end')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .text(d.subtitle);
      }
    });
  };

  // Render D3 Linear Address Strip / Memory Block Map
  const renderMemoryAddressMap = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = Math.max(120, height - margin.top - margin.bottom);

    // Calculate total continuous heap space (e.g. 0x1000 to 0x1200)
    const baseAddr = 0x1000;
    const maxAllocated = Math.max(
      ...snapshot.heapArrays.map((a) => a.address + a.length * 4),
      ...snapshot.heapObjects.map((o) => o.address + 24),
      baseAddr + 256
    );
    const endAddr = Math.ceil((maxAllocated - baseAddr + 64) / 64) * 64 + baseAddr;

    const xScale = d3.scaleLinear().domain([baseAddr, endAddr]).range([0, chartWidth]);

    const chartG = g.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Memory boundaries background bar
    chartG
      .append('rect')
      .attr('x', 0)
      .attr('y', 20)
      .attr('width', chartWidth)
      .attr('height', 44)
      .attr('rx', 6)
      .attr('fill', '#090d16')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1.5);

    // Address axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(8, Math.floor(chartWidth / 80)))
      .tickFormat((d) => `0x${Number(d).toString(16).toUpperCase()}`);

    chartG
      .append('g')
      .attr('transform', `translate(0, 72)`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-family', 'monospace')
      .attr('font-size', '9.5px');

    chartG.selectAll('.domain, .tick line').attr('stroke', '#334155');

    // Title label
    chartG
      .append('text')
      .attr('x', 0)
      .attr('y', 8)
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('JVM HEAP ADDRESS SPACE (HotSpot Memory Layout)');

    // Render Array Memory Blocks
    snapshot.heapArrays.forEach((arr) => {
      const startX = xScale(arr.address);
      const byteLen = Math.max(16 + arr.length * 4, 16);
      const blockWidth = Math.max(18, xScale(arr.address + byteLen) - startX);

      const blockG = chartG
        .append('g')
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedNode({
            id: `heap_${arr.address}`,
            type: 'heap_array',
            title: `int[${arr.length}]`,
            subtitle: `@0x${arr.address.toString(16).toUpperCase()}`,
            address: arr.address,
            arrayData: arr,
            byteSize: Math.ceil(byteLen / 8) * 8,
          });
        });

      blockG
        .append('rect')
        .attr('x', startX)
        .attr('y', 22)
        .attr('width', blockWidth)
        .attr('height', 40)
        .attr('rx', 4)
        .attr('fill', 'rgba(236, 72, 153, 0.25)')
        .attr('stroke', '#ec4899')
        .attr('stroke-width', 1.5);

      blockG
        .append('text')
        .attr('x', startX + blockWidth / 2)
        .attr('y', 42)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fbcfe8')
        .attr('font-size', '9.5px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(`[${arr.length}]`);

      blockG
        .append('text')
        .attr('x', startX + blockWidth / 2)
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f472b6')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(`${byteLen}B`);
    });

    // Render Object Blocks
    snapshot.heapObjects.forEach((obj) => {
      const startX = xScale(obj.address);
      const byteLen = 24;
      const blockWidth = Math.max(18, xScale(obj.address + byteLen) - startX);

      const blockG = chartG.append('g').attr('cursor', 'pointer');

      blockG
        .append('rect')
        .attr('x', startX)
        .attr('y', 22)
        .attr('width', blockWidth)
        .attr('height', 40)
        .attr('rx', 4)
        .attr('fill', 'rgba(245, 158, 11, 0.25)')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5);

      blockG
        .append('text')
        .attr('x', startX + blockWidth / 2)
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fef3c7')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(obj.className.slice(0, 4));
    });
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
    setZoomLevel(1);
  };

  const handleZoomBy = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, factor);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden ${className} ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-slate-950/98 backdrop-blur-md' : ''
      }`}
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center">
            <HardDrive className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">
              D3 JVM Heap Visualizer
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-pink-950/80 text-pink-300 border border-pink-700/50 rounded">
              {heapMetrics.totalCount} alloc ({heapMetrics.totalBytes}B)
            </span>
          </div>
        </div>

        {/* View Mode & Controls */}
        <div className="flex items-center gap-1.5">
          {/* Topology vs Linear Map Segmented Switch */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('topology')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'topology'
                  ? 'bg-slate-800 text-pink-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>Reference Graph</span>
            </button>
            <button
              onClick={() => setViewMode('memoryMap')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'memoryMap'
                  ? 'bg-slate-800 text-pink-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>Address Strip</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 border border-slate-800 rounded bg-slate-950 p-0.5">
            <button
              onClick={() => handleZoomBy(1.2)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleZoomBy(0.8)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Fullscreen Expand Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors"
            title={isFullscreen ? 'Close full screen' : 'Expand full screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 bg-slate-950 min-h-[260px] overflow-hidden">
        <svg ref={svgRef} className="w-full h-full select-none" />

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-800/80 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>LVT Ref</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Stack Ref</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-pink-500" />
            <span>Heap Array</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500" />
            <span>Heap Object</span>
          </div>
          <span className="text-slate-600">·</span>
          <span>Zoom: {zoomLevel}x</span>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-2 right-2 max-w-xs w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs font-mono shadow-xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-pink-400" />
                <span>Node Inspector</span>
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-slate-200 font-semibold">{selectedNode.type}</span>
              </div>
              {selectedNode.address && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Heap Addr:</span>
                  <span className="text-pink-400 font-bold">
                    0x{selectedNode.address.toString(16).toUpperCase()}
                  </span>
                </div>
              )}
              {selectedNode.byteSize && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory Footprint:</span>
                  <span className="text-emerald-400">{selectedNode.byteSize} Bytes</span>
                </div>
              )}
              {selectedNode.arrayData && (
                <div>
                  <span className="text-slate-400 block mb-1">Array Content:</span>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-[10px] max-h-24 overflow-y-auto">
                    [{selectedNode.arrayData.elements.join(', ')}]
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Heap Memory Summary Footer */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>Eden/Heap Space: <strong className="text-slate-200">0x1000 - 0x2000</strong></span>
          <span>Live Pointers: <strong className="text-cyan-400">{roots.length}</strong></span>
          <span>Active GC Objects: <strong className="text-emerald-400">{heapMetrics.liveObjects}</strong></span>
        </div>
        <span className="text-slate-500">Drag nodes to rearrange · Scroll to zoom</span>
      </div>
    </div>
  );
};
