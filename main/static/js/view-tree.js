
function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
}
function dragged(d) {
    d3.select(this)
            .attr("cx", d.x = d3.event.x)
            .attr("cy", dy = d3.event.y);
}
function dragended(d) {
    d3.select(this).classed("dragging", false);
}

function zoom_all_to_node(node) {
    for(var i = 0; i < item_views.length; i++) {
        if(item_views[i].mode != "tree")
            continue;
        zoom_to_node(item_views[i], node);
    }
}
function zoom_to_node(item_view, node) {
    var elem = $("#"+item_view.tree_id);
    var width = elem.width();
    var height = elem.height();
    var x = -node.x * item_view.zoom.scale() + width / 2;
    var y = -node.y * item_view.zoom.scale() + height / 2;
    item_view.zoom.translate([x, y]);
    item_view.container
            .transition()
            .duration(1200)
            .attr("transform", "translate("+item_view.zoom.translate()+")scale("+item_view.zoom.scale()+")");
}
function tree_init(item_view) {
    item_view.container = null;
    var zoomfun = function() {
        item_view.container
                .attr("transform", "translate("+item_view.zoom.translate()+")scale("+item_view.zoom.scale()+")");
    }
    item_view.zoom = d3.behavior.zoom()
            .scaleExtent([0.05, 10])
            .on("zoom", zoomfun)
            ;
    var drag = d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended)
            ;
    item_view.tree_drawable = d3.select("#"+item_view.tree_id)
            .append("g")
            .classed("zoomnpan", true)
            .call(item_view.zoom)
            ;
    var background = item_view.tree_drawable.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("fill", "#ccddcc")
            .style("pointer-events", "all")
            ;
    item_view.container = item_view.tree_drawable.append("g")
            .classed("container", true)
            ;
    var layers = ["debug", "links", "nodes", "relations"];
    item_view.container.selectAll("g.layer")
            .data(layers)
            .enter()
            .append("g")
            .attr("class", function(d) { return d; })
            .classed("layer", true)
            ;
    item_view.linksvg = item_view.container.selectAll("g.layer.links").selectAll("path.link");
    item_view.nodesvg = item_view.container.selectAll("g.layer.nodes").selectAll("g.node");
    item_view.relationsvg = item_view.container.selectAll("g.layer.relations").selectAll("g.relation");
}

function enter_all() {
    for(var i = 0; i < item_views.length; i++) {
        if(item_views[i].mode != "tree")
            continue;
        if(item_views[i].tree_ready)
            enter(item_views[i]);
    }
}
function enter(view) {
    view.linksvg = view.linksvg
            .data(Hiski.links)
            ;
    var newlinks = view.linksvg.enter()
            .append("path")
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("stroke", "#000")
                .classed("link", true)
                .attr("d", function(d) {
                        return line_function(d.get_path_points())
                    })
            ;

    view.nodesvg = view.nodesvg
            .data(Hiski.nodes)
            ;
    var newnodes = view.nodesvg.enter()
            .append("g")
                .classed("node", true)
                .attr("transform", function(d) { return "translate("+d.get_x()+","+d.get_y()+") scale(0.01)"})
                .on("click", function(d) {
                    Hiski.select_node(d, true);
                    d.expand_surroundings();
                })
            ;
    newnodes.append("circle")
            .attr("r", 20)
            .style("fill", Hiski.node_color_function)
            ;
    newnodes.append("svg:text")
            .attr("text-anchor", "middle")
            .attr("y", -10)
            .attr("dominant-baseline", "central")
            .text(function(d) {
                return d.name;
            })
            .style("filter", "url(#dropshadow)")
            .style("font-weight", "bold")
            .style("font-size", "60%")
            ;
    newnodes.append("svg:text")
            .attr("text-anchor", "middle")
            .attr("y", 5)
            .attr("dominant-baseline", "central")
            .text(function(d) {
                return d.data.birth_date_string;
            })
            .style("filter", "url(#dropshadow)")
            .style("font-weight", "normal")
            .style("font-size", "50%")
            ;
    newnodes.append("svg:text")
            .attr("text-anchor", "middle")
            .attr("y", 15)
            .attr("dominant-baseline", "central")
            .text(function(d) {
                return d.data.death_date_string;
            })
            .style("filter", "url(#dropshadow)")
            .style("font-weight", "normal")
            .style("font-size", "50%")
            ;


    view.relationsvg = view.relationsvg
            .data(Hiski.relations)
            ;
    var newrelations = view.relationsvg.enter()
            .append("g")
                .classed("relation", true)
                .attr("transform", function(d) { return "translate("+d.get_x()+","+d.get_y()+") scale(0.01)"})
            ;
    newrelations.append("circle")
            .attr("r", 5)
            .on("click", function(d) { d.expand_surroundings(); })
            ;
}
function render_all() {
    for(var i = 0; i < item_views.length; i++) {
        if(item_views[i].mode != "tree")
            continue;
        if(item_views[i].tree_ready)
            render(item_views[i]);
    }
    if(Hiski.map) {
        update_map();
    }
    Hiski.lastselected = Hiski.selected;
}
function render(view) {
    var duration = 2200;
    var short_duration = 300;

    view.linksvg
            .transition()
            .duration(duration)
            .attr("d", function(d) {
                    return line_function(d.get_path_points())
                })
            ;
    view.linksvg
            .style("stroke", function(d) {
                    return d.node == Hiski.selected ? "#ffffff" : d.get_color();
                })
            .style("stroke-width", function(d) {
                    return d.node == Hiski.selected ? 4 : 2;
                })
            ;
    var move_to_front = function(elem) {
        elem.parentNode.appendChild(elem);
    }
    view.linksvg.each(function(d) {
        if(d.node == Hiski.selected)
            move_to_front(this);
    })

    view.nodesvg
            .transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate("+d.get_x()+","+d.get_y()+")"})
            ;
    view.nodesvg.selectAll("circle")
//            .transition()
//            .duration(short_duration)
            .style("fill", Hiski.node_color_function)
            .style("stroke", function(d) { return d == Hiski.selected ? "#ffffff" : "#000000" })
            .style("stroke-width", function(d) { return d == Hiski.selected ? 3 : 1 })
            ;

    var next_to_selected = function(d) {
        if(Hiski.selected === null)
            return false;
        for(var i = 0; i < Hiski.selected.relations.length; i++) {
            if(Hiski.selected.relations[i] == d)
                return true;
        }
        return false;
    }
    if(Hiski.lastselected != Hiski.selected) {
        view.relationsvg.selectAll("circle")
                .style("stroke", "#ffffff")
                .style("fill", "#000000")
                ;
    }
    view.relationsvg.selectAll("circle")
            .attr("r", 5)
            ;
    view.relationsvg
            .transition()
            // shorter duration here makes no sense, but the desync makes no sense either
            .duration(duration)
            .attr("transform", function(d) { return "translate("+d.get_x()+","+d.get_y()+")"})
            .selectAll("circle")
//            .transition()
//            .duration(short_duration)
            ;
    view.relationsvg.selectAll("circle")
            .style("fill", function(d) { return next_to_selected(d) ? "#ffffff" : "#000000" })
            .style("stroke", function(d) { return next_to_selected(d) ? "#000000" : "#ffffff" })
//            .attr("r", function(d) { return next_to_selected(d) ? 8 : 5 })
            ;
}

