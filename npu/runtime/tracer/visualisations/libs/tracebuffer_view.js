

class TraceBufferView {

	static overview_height = 100;

	constructor(svg, ypos, width, buffer, maxts) {
		this.svg = svg;
		this.ypos = ypos
		this.width = width;
		this.maxts = maxts;
		this.buffer = buffer
		
		this.updateInterval = 25 
		this.inThrottle = false
		this.slider_ts_min = (0.25*this.width);
		this.slider_ts_max = (0.75*this.width);

		this.overview_event_height = 5;
		this.overview_event_width = 1;
				
		this.cleanup_stack = []; 
		this.mark_cleanup_stack = []; // cleaning up and TS marks
		this.all_events = [];
		this.window_events = [];
		this.event_labels = {};
		this.max_y = 0;

		this.events_x_off = 150;
		this.draw_overview();
		this.highlight_event_selection();
		this.draw_main_window();

		// for tracking clicks and time measurement
		this.first_click = false;
		this.second_click = false;
		this.start_click_ts = 0;
		this.end_click_ts = 0;
	}

	add_event_track_label(x,y,text) {
            var textElement = this.svg.append("text")
                                  .attr("x", x)
                                  .attr("y", y)
                                  .attr("font-family", "sans-serif")
                                  .attr("font-size", "10px")
                                  .attr("fill", "black")
                                  .text(text);
	   return textElement.node().getBBox().height + 5;
	}

	// triggered when an event is clicked and draws a TS measurement line
	// between the two points
	// Everything should be cleaned up if the overview bar is adjusted
	event_clicked(event_ts) {
		var ov_xscale = d3.scaleLinear([0,this.maxts],[0,width]);
		var ov_xscale = d3.scaleLinear([0,this.maxts],[0,width]);
		var min_ts = ov_xscale.invert(this.slider_ts_min);
		var max_ts = ov_xscale.invert(this.slider_ts_max);
		var mw_xscale = d3.scaleLinear([min_ts, max_ts], [this.events_x_off, width]);  

		if (!this.first_click && !this.second_click) {
			this.start_click_ts = event_ts;
			this.add_ts_mark(mw_xscale(event_ts));
			this.first_click = true; 
		} else if (this.first_click && !this.second_click) {
			this.end_click_ts = event_ts;
			this.add_ts_mark(mw_xscale(event_ts));
			this.second_click = true;
			this.join_ts_marks(mw_xscale);
		} else {
			this.mark_cleanup();
			this.start_click_ts = event_ts;
			this.add_ts_mark(mw_xscale(event_ts));
			this.first_click = true; 
		}
	}
	
	add_ts_mark(x) {
		var mark = this.svg.append("rect")
		                   .attr("x", x)
		                   .attr("y", this.max_y + 20)
		                   .attr("fill", "red")
		                   .attr("width", 2)
		                   .attr("height", 25);
		this.mark_cleanup_stack.push(mark);
	}

	join_ts_marks(mw_xscale) {
		var join = this.svg.append("line")
		                   .attr("x1", mw_xscale(this.start_click_ts))
		                   .attr("y1", this.max_y + 30)
		                   .attr("x2", mw_xscale(this.end_click_ts))
		                   .attr("y2", this.max_y + 30)
		                   .attr("stroke", "red")
		                   .attr("stroke-width", 2)
		                   .style("stroke-dasharray", ('5,5'));

		var mid_x = (mw_xscale(this.start_click_ts) + mw_xscale(this.end_click_ts))/2;

		var ts_calc = this.svg.append("text")
                                      .attr("x", mid_x)
                                      .attr("y", this.max_y + 55)
                                      .attr("font-family", "sans-serif")
                                      .attr("font-size", "14px")
				      .attr("text-anchor", "middle")
                                      .attr("fill", "red")
                                      .text(Math.abs(this.end_click_ts - this.start_click_ts));

		this.mark_cleanup_stack.push(ts_calc);
		this.mark_cleanup_stack.push(join);
	}

	mark_cleanup(){
		this.first_click = false;
		this.second_click = false;
		for(var i in this.mark_cleanup_stack) {
			this.mark_cleanup_stack[i].remove();
		}
		this.mark_cleanup_stack = [];
	}

	// removes all items placed into the cleanup stack
	cleanup(){
		this.mark_cleanup();
		for (var i in this.cleanup_stack) {
			this.cleanup_stack[i].remove();
		}

		this.cleanup_stack = [];
	}

	add_event(x,y,colour, event_id, event_ts) {
		var eventElem = this.svg.append("rect")
		                        .attr("x", x)
		                        .attr("y", y)
		                        .attr("event_id", event_id)
		                        .attr("event_ts", event_ts)
		                        .attr("fill", colour)
					.attr("width", 2)
		                        .attr("height", 12)
					.on("mouseover", (event,d) => {
						d3.selectAll("#tooltip").remove();
						var curEvent = d3.select(event.currentTarget);
						var event_id = curEvent.attr("event_id");
						var event_ts = curEvent.attr("event_ts");
						var x = parseInt(curEvent.attr("x"));
                            			var y = parseInt(curEvent.attr("y"));
						var ttip = new ToolTip(this.svg, x+20, y+20, event_ts+":"+event_id); 
					})
					.on("mouseout", function() {
						d3.selectAll("#tooltip").remove();
					})
		                        .on("click", (event, d) => {
						var curEvent = d3.select(event.currentTarget);
						var event_ts = curEvent.attr("event_ts");
						this.event_clicked(event_ts);
					});
		return eventElem;
	}

	draw_main_window() {
		this.cleanup();

		var ov_xscale = d3.scaleLinear([0,this.maxts],[0,width]);
		var min_ts = ov_xscale.invert(this.slider_ts_min);
		var max_ts = ov_xscale.invert(this.slider_ts_max);

		var mw_xscale = d3.scaleLinear([min_ts, max_ts], [this.events_x_off, width]);  
		var xaxis = d3.axisTop(mw_xscale);
		var axis_obj = this.svg.append("g")
			.attr("transform", "translate(-7,"+(this.max_y+10)+")")
		        .call(xaxis);

		this.cleanup_stack.push(axis_obj);		

		for (var e in this.window_events) {
		    var event_id = this.window_events[e][0];
		    var event_ts = this.window_events[e][1];
		    if ((event_ts > min_ts) && (event_ts < max_ts)) {
			this.cleanup_stack.push(
				this.add_event(
					mw_xscale(event_ts),
					this.event_labels[event_id]["pos"],
					this.event_labels[event_id]["col"],
					event_id,
					event_ts
			));
		    }
		}
	}

	add_overview_event(x,y,colour, idx) {
		var eventElement = this.svg.append("rect")
					   .attr("origColour", colour) 
					   .attr("orig_idx", idx) 
		                           .attr("width", this.overview_event_width)
		                           .attr("height", this.overview_event_height)
		                           .attr("x", x)
		                           .attr("y", y);

		if ((x > this.slider_ts_min) && (x < this.slider_ts_max)) {
			eventElement.attr("fill", colour);
		} else {
			eventElement.attr("fill", "lightgrey");
		}

		return eventElement;
	}

	// throttle the update rate
	throttle(func) {
		return (...args) => {
			if(!this.inThrottle) {
				func.apply(this, args);
				this.inThrottle = true;
				setTimeout(() => this.inThrottle = false, this.updateInterval);
			}
		}
	}

	highlight_event_selection() {
		this.window_events = [] 
		for ( var e in this.all_events ) {
			var e_x = this.all_events[e].attr("x");
			if ((e_x > this.slider_ts_min) && (e_x < this.slider_ts_max)) {
				var orig = this.all_events[e].attr("origColour");
				this.all_events[e].attr("fill", orig);

				var idx = this.all_events[e].attr("orig_idx");
				this.window_events.push(this.buffer[idx]);
			} else {
				this.all_events[e].attr("fill", "lightgrey");
			}
		}
	}

	draw_overview(){
		const events_y_off = 75;
		const labels_x_off = 0;
		var xscale = d3.scaleLinear([0, this.maxts], [0, this.width]);
		var colourClass = d3.scaleOrdinal(d3.schemeCategory10);
		var cur_y = this.ypos; 
		var labels_cur_y = events_y_off;
		events = {};
		for (var e in this.buffer) {
			var event_id = this.buffer[e][0];
			var event_ts = this.buffer[e][1];
			if (!(event_id in events)) {
			    cur_y += this.overview_event_height; 
			    events[event_id] = cur_y; // overview y position	

			    this.event_labels[event_id] = {
				    "pos": labels_cur_y - 10,
				    "col": colourClass(event_id)
			    }; // Main window label
	                    labels_cur_y += this.add_event_track_label(labels_x_off, labels_cur_y, event_id); 
			    this.max_y = Math.max(this.max_y, labels_cur_y);
			}

			this.all_events.push(
			    this.add_overview_event(
				xscale(event_ts),
				events[event_id],
				colourClass(event_id),
				e
			    )
			);
		}
		
		// Min slider
		const throttled_highlight_event_selection = this.throttle(this.highlight_event_selection);
		var slider_width = 4;
		this.svg.append("rect")
			.attr("id", "min_slider")
		        .attr("x", this.slider_ts_min)
		        .attr("y", this.ypos - 10)
		        .attr("width", slider_width)
		        .attr("height", cur_y - this.ypos + 20)
		        .attr("fill", "grey")
		        .attr("cursor", "pointer")
		        .call(d3.drag().on("drag" , (event) => {
				var updateX = event.x - slider_width/2;
				if ( (updateX < this.slider_ts_max) && (updateX > 0) && (updateX < this.width - 2))  {
					this.slider_ts_min = updateX;
					d3.select("#min_slider").attr("x", updateX);
					throttled_highlight_event_selection();
				} else {
				  console.log("updateX= "+updateX+",  slider_ts_min="+this.slider_ts_min);
				}
			})
			.on("end", (event) => {
				this.draw_main_window();
			})
			);

		this.svg.append("rect")
			.attr("id", "max_slider")
		        .attr("x", this.slider_ts_max)
		        .attr("y", this.ypos - 10)
		        .attr("width", slider_width)
		        .attr("height", cur_y - this.ypos + 20)
		        .attr("fill", "grey")
		        .attr("cursor", "pointer")
		        .call(d3.drag().on("drag" , (event) => {
				var updateX = event.x - slider_width/2;
				if ( (updateX > this.slider_ts_min) && (updateX > 0) && (updateX < this.width - 2))  {
					this.slider_ts_max = updateX;
					d3.select("#max_slider").attr("x", updateX);
					throttled_highlight_event_selection();
				} else {
				  console.log("updateX= "+updateX+",  slider_ts_max="+this.slider_ts_max);
				}
			})
		        .on("end", (event) => {
                                this.draw_main_window();
			})
			);
		        

		//this.draw_main_window();
	}
}

