import { Play, Undo2 } from 'lucide-react';

export default function SandboxHeader({ timeShiftDays, handleTimeTravel, setTimeShiftDays }) {
  return (
    <header className="bg-amber-500 text-white px-4 py-2 flex flex-wrap justify-between items-center text-xs font-semibold shadow-sm gap-2">
      <div className="flex items-center gap-2">
        <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm">Developer Sandbox</span>
        <span>Simulated Time Shift: <strong className="underline text-sm font-extrabold">{timeShiftDays} Days Passed</strong></span>
      </div>
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => handleTimeTravel(3)} 
          className="bg-amber-600 hover:bg-amber-700 active:translate-y-0.5 text-white px-2.5 py-1 rounded transition flex items-center gap-1 shadow-sm"
        >
          <Play className="w-3 h-3 fill-white" /> +3 Days
        </button>
        <button 
          onClick={() => handleTimeTravel(7)} 
          className="bg-amber-700 hover:bg-amber-800 active:translate-y-0.5 text-white px-2.5 py-1 rounded transition flex items-center gap-1 shadow-sm font-bold"
        >
          <Play className="w-3 h-3 fill-white" /> +7 Days (Test Recurrence!)
        </button>
        <button 
          onClick={() => setTimeShiftDays(0)} 
          className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded transition flex items-center gap-1 text-[10px]"
          title="Reset simulation timeline"
        >
          <Undo2 className="w-3 h-3" /> Reset
        </button>
      </div>
    </header>
  );
}
