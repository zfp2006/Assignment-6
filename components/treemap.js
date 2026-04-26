import { treemap, hierarchy, scaleOrdinal, schemeDark2 } from "d3";

// Safely handles both objects (the root) and arrays (the children)
function cleanData(data) {
    if (!data) return undefined;

    // If 'data' is an array of children
    if (Array.isArray(data)) {
        // If this level is "null", bypass it and return its children instead
        if (data.length > 0 && data[0].attr === "null") {
            return cleanData(data[0].children);
        }
        // Otherwise, clean each child normally
        return data.map(child => cleanData(child));
    }

    // If 'data' is a single node object (like the root object)
    return {
        ...data,
        children: cleanData(data.children)
    };
}

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;

    const cleanTree = cleanData(tree);
    
    // Check if the tree exists and actually has children to render
    if (!cleanTree || !cleanTree.children || cleanTree.children.length === 0) {
        return <div>Please select at least one valid attribute.</div>;
    }

    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom;

    const root = hierarchy(cleanTree)
        .sum(d => (d.children && d.children.length > 0) ? 0 : d.value)
        .sort((a, b) => b.value - a.value);

    const treemapLayout = treemap()
        .size([innerWidth, innerHeight])
        .paddingInner(3)
        .paddingOuter(4);
    
    treemapLayout(root);

    const color = scaleOrdinal(schemeDark2);

    const nodes = root.descendants().filter(d => d.depth > 0);
    const leaves = nodes.filter(d => !d.children);

    return (
        <svg 
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                
                {/* LAYER 1: Colored Leaf Nodes */}
                {leaves.map((node, i) => {
                    const { x0, x1, y0, y1, data } = node;
                    const width = x1 - x0;
                    const height = y1 - y0;
                    
                    return (
                        <g key={`leaf-${i}`} transform={`translate(${x0}, ${y0})`}>
                            <rect 
                                width={width} 
                                height={height} 
                                fill={color(data.name)}
                                stroke="white"
                                strokeWidth={1}
                                onClick={() => setSelectedCell(node)}
                                style={{ 
                                    cursor: "pointer", 
                                    opacity: selectedCell === node ? 0.7 : 1 
                                }}
                            />
                            {width > 40 && height > 30 && (
                                <text x={4} y={14} fontSize={11} fill="white" style={{ pointerEvents: "none" }}>
                                    <tspan x={4} dy="0">{`${data.attr}: ${data.name}`}</tspan>
                                    <tspan x={4} dy="14">{data.value}</tspan>
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* LAYER 2: Structural Borders */}
                {nodes.map((node, i) => {
                    const { x0, x1, y0, y1, depth, children } = node;
                    
                    if (!children && depth !== 1) return null; 
                    
                    return (
                        <rect 
                            key={`border-${i}`}
                            x={x0} y={y0}
                            width={x1 - x0} 
                            height={y1 - y0} 
                            fill="transparent"
                            stroke="black"
                            strokeWidth={depth === 1 ? 1.5 : 0.5} // Thinner borders
                            style={{ pointerEvents: "none" }}
                        />
                    );
                })}

                {/* LAYER 3: Hierarchical Watermark Text */}
                {nodes.map((node, i) => {
                    const { x0, x1, y0, y1, data, depth, children } = node;
                    const width = x1 - x0;
                    const height = y1 - y0;
                    
                    // Find the exact mathematical center of the rect
                    const centerX = x0 + width / 2;
                    const centerY = y0 + height / 2;
                    
                    if (depth === 1 && width > 60 && height > 40) {
                        return (
                            <text 
                                key={`text-${i}`} 
                                x={centerX} 
                                y={centerY} 
                                textAnchor="middle" 
                                dominantBaseline="central" 
                                fontSize={26} 
                                fill="black" 
                                opacity={0.3} 
                                fontWeight="bold" 
                                style={{ pointerEvents: "none" }}
                            >
                                {`${data.attr}: ${data.name}`}
                            </text>
                        );
                    }
                    if (depth > 1 && children && width > 50 && height > 20) {
                        return (
                            <text 
                                key={`text-${i}`} 
                                x={centerX} 
                                y={centerY} 
                                textAnchor="middle" 
                                dominantBaseline="central" 
                                fontSize={14} 
                                fill="black" 
                                opacity={0.4} 
                                fontWeight="bold" 
                                style={{ pointerEvents: "none" }}
                            >
                                {`${data.attr}: ${data.name}`}
                            </text>
                        );
                    }
                    return null;
                })}

            </g>
        </svg>
    );
}