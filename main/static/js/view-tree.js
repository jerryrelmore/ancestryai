
var container = null;
var zoom = null;
function zoomed() {
    container.attr("transform", "translate("+d3.event.translate+")scale("+d3.event.scale+")");
}
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

function tree_init(item_view) {
    var container = null;
    var zoomfun = function() {
        container.attr("transform", "translate("+d3.event.translate+")scale("+d3.event.scale+")");
    }
    var zoom = d3.behavior.zoom()
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
            .call(zoom)
            ;
    var background = item_view.tree_drawable.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("fill", "#ccddcc")
            .style("pointer-events", "all")
            ;
    container = item_view.tree_drawable.append("g")
            .classed("container", true)
            ;
    var layers = ["debug", "links", "nodes", "relations"];
    container.selectAll("g.layer")
            .data(layers)
            .enter()
            .append("g")
            .attr("class", function(d) { return d; })
            .classed("layer", true)
            ;
    item_view.linksvg = container.selectAll("g.layer.links").selectAll("path.link");
    item_view.nodesvg = container.selectAll("g.layer.nodes").selectAll("g.node");
    item_view.relationsvg = container.selectAll("g.layer.relations").selectAll("g.relation");
}

function d3_init() {
    zoom = d3.behavior.zoom()
            .scaleExtent([0.05, 10])
            .on("zoom", zoomed)
            ;
    var drag = d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended)
            ;

    svg = d3.select("svg#tree")
            .append("g")
            .classed("zoomnpan", true)
            .call(zoom)
            ;
    var background = svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("fill", "none")
            .style("pointer-events", "all")
            ;
    container = svg.append("g")
            .classed("container", true)
            ;
    var layers = ["debug", "links", "nodes", "relations"];
    container.selectAll("g.layer")
            .data(layers)
            .enter()
            .append("g")
            .attr("class", function(d) { return d; })
            .classed("layer", true)
            ;
    Hiski.linksvg = container.selectAll("g.layer.links").selectAll("path.link");
    Hiski.nodesvg = container.selectAll("g.layer.nodes").selectAll("g.node");
    Hiski.relationsvg = container.selectAll("g.layer.relations").selectAll("g.relation");
}
function enter_all() {
    for(var i = 0; i < item_views.length; i++) {
        if(item_views[i].mode != "tree")
            continue;
        if(item_views[i].tree_ready)
            enter(item_views[i]);
    }
}
function select_node(d) {
    Hiski.selected = d;
    for(var i = 0; i < item_views.length; i++) {
        item_views[i].selected_node = d;
        if(item_views[i].mode == "info") {
            item_views[i].redraw();
            continue;
        }
    }
    render_all();
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
                    select_node(d);
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
            .style("stroke", function(d) {
                    return d.node == Hiski.selected ? "#ffffff" : d.get_color();
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
            .transition()
            .duration(short_duration)
            .style("fill", Hiski.node_color_function)
            .style("stroke", function(d) { return d == Hiski.selected ? "#ffffff" : "#000000" })
            .style("stroke-width", function(d) { return d == Hiski.selected ? 3 : 1 })
            ;

    var next_to_selected = function(d) {
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
    view.relationsvg
            .transition()
            // shorter duration here makes no sense, but the desync makes no sense either
            .duration(duration)
            .attr("transform", function(d) { return "translate("+d.get_x()+","+d.get_y()+")"})
            .selectAll("circle")
            .transition()
            .duration(short_duration)
            .style("fill", function(d) { return next_to_selected(d) ? "#ffffff" : "#000000" })
            .style("stroke", function(d) { return next_to_selected(d) ? "#000000" : "#ffffff" })
            ;
}

