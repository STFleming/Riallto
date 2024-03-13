from typing import List, Dict
from .word_parser import parse_packets
from .trace_buffers import TraceBuffers
from .trace_frames import parse_frames
from .perfetto_generation import construct_timeline

class Parser:

    def __init__(self, filename:str, events:List[str])->None:
        """ Parses the raw trace file """
        with open(filename, "r") as fp:
            trace_words = fp.read().split("\n")
            self.packets = parse_packets(trace_words)

            self.tb = TraceBuffers()
            for p in self.packets:
                self.tb.add(p)

            self._timelines = {}
            for buff, trace in self.tb.buffers.items():
                frames = parse_frames(trace, events)
                timeline = construct_timeline(frames)

                # remove any long stalls at the end of the timeline
                end_stall_count=0
                for i in reversed(timeline):
                    if i[0] == ['LOCK_STALL']:
                        end_stall_count = end_stall_count + 1
                    else:
                        break
                timeline = timeline[:len(timeline)-end_stall_count]
                self._timelines[buff] = timeline
        
    @property
    def timelines(self)->Dict:
        return self._timelines
