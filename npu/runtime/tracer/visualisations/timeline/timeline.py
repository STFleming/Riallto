# Copyright (C) 2022 Xilinx, Inc
# SPDX-License-Identifier: BSD-3-Clause

from ..vis import Vis
import random
import string
import json
from typing import Dict

class TimelineVis(Vis):
    
    def _gen_vis_json(self, timelines:Dict)->str:
        """ Returns a string that contains 
            the format that the visualisation
            is expecting
        """
        d = {}
        d['buffers'] = {} 
        maxts = 0
        for b, timeline in timelines.items():
            name = f"Tile_{b.loc[0]}_{b.loc[1]}:{b.p_type}"
            d['buffers'][name] = [] 
            for es in timeline:
                for e in es[0]:
                    for i in range((es[1][1] - es[1][0]) + 1):
                        d['buffers'][name].append((e, es[1][0] + i)) # generate a completely flat event list
                        maxts = max(maxts, es[1][0] + i)  
        d['maxts'] = maxts 
        return json.dumps(d) 

    def __init__(self, timelines)->None:
        self.timelines = timelines

        letters = string.ascii_lowercase
        self.canvas = ''.join(random.choice(letters) for i in range(8))

        self.body = "var g = " + self._gen_vis_json(self.timelines) + ";\n\n" 
        self.body += """
            var margin = {top:15, right:5, bottom: 5, left: 5},
                        width=1000 - margin.left - margin.right,
                        height=400 - margin.top - margin.bottom;
        """
        self.body += f"var svg = d3.select(\"#UNIQUE_CANVAS_NAME\").append(\"svg\")"
        self.body += """.attr(\"height\", height)
                        .attr(\"width\", width)
                        .append(\"g\")
                        .attr(\"transform\", \"translate(\"+margin.left+\",\"+margin.top+\")\"); 
                    """

        self.body += f"""

        """
        
        self.body += """
           
            function add_text(x,y,text, size) {
                var textElement = svg.append("text")
                                     .attr("x", x)
                                     .attr("y", y)
                                     .attr("font-family", "sans-serif")
                                     .attr("font-size", size)
                                     .attr("fill", "black")
                                     .text(text);

                return textElement.node().getBBox().height;
            }

            function add_event(x,y,colour,width){
                var eventElement = svg.append("rect")
                                      .attr("width", width)
                                      .attr("height", 12)
                                      .attr("x", x)
                                      .attr("y", y)
                                      .attr("fill", colour);
            }

            // Draws an overview of the timeline with two sliders for adjusting 
            function drawOverview(buffer, ypos) {
                    
            }

            function draw() {
                
                //var curr_offset = 0; // Keep track of where we are on the y-axis
                //var text_y_box = 150;
                //var event_width = 1;
                //var yscale = d3.scaleLinear([0,(g.maxts)],[text_y_box,width]); 
                //var colourClass = d3.scaleOrdinal(d3.schemeCategory10);

                for(buffer in g.buffers) {
                    console.log(buffer);
                    events = {}

                    var view = new TraceBufferView(svg, 0, width, g.buffers[buffer], g.maxts); 

                //    curr_offset += add_text(0, curr_offset, buffer, "16px");

                //    for (event in g.buffers[buffer]){
                //        event_id = g.buffers[buffer][event][0];
                //        event_ts = g.buffers[buffer][event][1];
                //        if (!(event_id in events)) {
                //            curr_offset += add_text(10, curr_offset, event_id, "12px");        
                //            events[event_id] = curr_offset - 12;
                //        }

                //        add_event(yscale(event_ts),
                //                  events[event_id],
                //                  colourClass(event_id),
                //                  event_width );

                //                  
                //    }
                }
            }
                
            draw();

        """

        self.body = self.body.replace("UNIQUE_CANVAS_NAME", self.canvas)

        super().__init__(js_files=['libs/d3.v7.min.js', 'libs/tracebuffer_view.js', 'libs/tooltip.js'],body=self.body, canvas_name=self.canvas)
        #self.render()
            
        


        






