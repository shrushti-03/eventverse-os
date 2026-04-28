'use client';

import { useState } from 'react';
import {
  DollarSign,
  Calculator,
  Lightbulb,
  PiggyBank,
  Download,
  TrendingDown,
  ChevronDown,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { estimateBudget } from '@/lib/api';

interface BudgetItem {
  category: string;
  item: string;
  estimated_cost: number;
  quantity: number;
  total: number;
  alternatives?: { item: string; savings?: number; savings_percent?: number }[];
}

interface BudgetResult {
  total_estimated: number;
  breakdown: BudgetItem[];
  optimization_tips: string[];
  savings_potential: number;
}

export default function BudgetPlanner() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    event_type: 'technical',
    expected_attendees: 100,
    venue: '',
    duration_hours: 4,
    requirements: [] as string[],
  });

  const [budget, setBudget] = useState<BudgetResult | null>(null);

  const requirements = [
    { id: 'food', label: 'Food & Catering' },
    { id: 'av_equipment', label: 'AV Equipment' },
    { id: 'photography', label: 'Photography' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'marketing', label: 'Marketing Materials' },
    { id: 'decorations', label: 'Decorations' },
  ];

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      const response = await estimateBudget({
        event_type: formData.event_type,
        expected_attendees: formData.expected_attendees,
        venue: formData.venue,
        duration_hours: formData.duration_hours,
        requirements: formData.requirements,
      });
      
      setBudget(response.data);
      setShowResults(true);
    } catch (error) {
      // Fallback to simulated data if API not available
      const simulatedBudget = calculateLocalBudget();
      setBudget(simulatedBudget);
      setShowResults(true);
    }
    
    setIsCalculating(false);
  };

  // Local budget calculation as fallback (mimics backend logic)
  const calculateLocalBudget = (): BudgetResult => {
    const breakdown: BudgetItem[] = [];
    let total = 0;
    const optimization_tips: string[] = [];
    let savings_potential = 0;

    // Venue cost based on attendees
    let venueCost = 2000;
    let venueType = 'Seminar Hall';
    if (formData.expected_attendees > 300) {
      venueCost = 5000;
      venueType = 'Auditorium';
    } else if (formData.expected_attendees > 100) {
      venueCost = 3000;
      venueType = 'Large Hall';
    }
    
    breakdown.push({
      category: 'Venue',
      item: venueType,
      estimated_cost: venueCost,
      quantity: 1,
      total: venueCost,
      alternatives: [
        { item: 'Open Ground', savings: Math.floor(venueCost * 0.5) },
        { item: 'Classroom', savings: Math.floor(venueCost * 0.7) },
      ]
    });
    total += venueCost;

    // Catering if selected
    if (formData.requirements.includes('food')) {
      const cateringCost = formData.expected_attendees * 100;
      breakdown.push({
        category: 'Catering',
        item: 'Snacks & Refreshments',
        estimated_cost: 100,
        quantity: formData.expected_attendees,
        total: cateringCost,
        alternatives: [{ item: 'In-house cafeteria', savings_percent: 20 }]
      });
      total += cateringCost;
      savings_potential += cateringCost * 0.2;
      optimization_tips.push('Consider partnering with college cafeteria for 20% savings on catering');
    }

    // AV Equipment
    if (formData.requirements.includes('av_equipment')) {
      const avCost = 2000;
      breakdown.push({
        category: 'Equipment',
        item: 'AV Equipment (Projector + Sound)',
        estimated_cost: avCost,
        quantity: 1,
        total: avCost,
        alternatives: [{ item: 'College AV equipment (free)', savings: avCost }]
      });
      total += avCost;
      savings_potential += avCost;
      optimization_tips.push('Request college AV equipment through official channels to save on rentals');
    }

    // Photography
    if (formData.requirements.includes('photography')) {
      const photoCost = 3000;
      breakdown.push({
        category: 'Documentation',
        item: 'Photography',
        estimated_cost: photoCost,
        quantity: 1,
        total: photoCost,
        alternatives: [{ item: 'Photography Club volunteers', savings: 2500 }]
      });
      total += photoCost;
      savings_potential += 2500;
      optimization_tips.push('Reach out to Photography Club for volunteer photographers');
    }

    // Certificates
    if (formData.requirements.includes('certificates')) {
      const certCost = formData.expected_attendees * 50;
      breakdown.push({
        category: 'Certificates',
        item: 'Participation Certificates',
        estimated_cost: 50,
        quantity: formData.expected_attendees,
        total: certCost,
        alternatives: [{ item: 'E-certificates', savings_percent: 80 }]
      });
      total += certCost;
      savings_potential += certCost * 0.8;
      optimization_tips.push('Switch to e-certificates for 80% savings and eco-friendly approach');
    }

    // Marketing
    if (formData.requirements.includes('marketing')) {
      const marketingCost = 1500;
      breakdown.push({
        category: 'Marketing',
        item: 'Posters & Promotion',
        estimated_cost: marketingCost,
        quantity: 1,
        total: marketingCost,
        alternatives: [{ item: 'Digital-only promotion', savings: 500 }]
      });
      total += marketingCost;
    }

    // Decorations
    if (formData.requirements.includes('decorations')) {
      const decoCost = 1000;
      breakdown.push({
        category: 'Decorations',
        item: 'Event Decorations',
        estimated_cost: decoCost,
        quantity: 1,
        total: decoCost,
        alternatives: [{ item: 'Student volunteer decorators', savings: 700 }]
      });
      total += decoCost;
    }

    // Contingency buffer
    const miscCost = Math.round(total * 0.1);
    breakdown.push({
      category: 'Miscellaneous',
      item: 'Contingency Buffer (10%)',
      estimated_cost: miscCost,
      quantity: 1,
      total: miscCost,
    });
    total += miscCost;

    // General tips
    if (total > 10000) {
      optimization_tips.push('Consider sponsorships from local businesses to offset costs');
    }
    if (formData.expected_attendees > 200) {
      optimization_tips.push('Large events qualify for institutional funding - check with administration');
    }

    return {
      total_estimated: Math.round(total),
      breakdown,
      optimization_tips,
      savings_potential: Math.round(savings_potential),
    };
  };

  const toggleExpanded = (category: string) => {
    setExpandedItems(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const chartData = budget?.breakdown.map((item) => ({
    name: item.category,
    value: item.total,
    color: ['#0ea5e9', '#d946ef', '#22c55e', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'][
      budget.breakdown.indexOf(item) % 7
    ],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Calculator className="w-8 h-8 mr-3 text-primary-500" />
          AI Budget Intelligence
        </h1>
        <p className="text-slate-400 mt-1">Strategic financial modeling and cost optimization</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="col-span-1 space-y-6">
          <div className="dark-card-bg rounded-2xl p-8 border border-slate-800/50">
            <h3 className="font-bold text-lg text-white mb-6 tracking-tight">Financial Parameters</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Event Classification</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="technical" className="bg-slate-900">Technical</option>
                  <option value="cultural" className="bg-slate-900">Cultural</option>
                  <option value="sports" className="bg-slate-900">Sports</option>
                  <option value="workshop" className="bg-slate-900">Workshop</option>
                  <option value="seminar" className="bg-slate-900">Seminar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Scale (Attendees)</label>
                <input
                  type="number"
                  value={formData.expected_attendees}
                  onChange={(e) => setFormData({ ...formData, expected_attendees: parseInt(e.target.value) })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Operational Duration (Hrs)</label>
                <input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Logistical Needs</label>
                <div className="grid grid-cols-1 gap-3">
                  {requirements.map((req) => (
                    <label key={req.id} className={`flex items-center space-x-3 cursor-pointer p-3 rounded-xl border transition-all duration-300 ${
                      formData.requirements.includes(req.id) 
                        ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                        : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.requirements.includes(req.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, requirements: [...formData.requirements, req.id] });
                          } else {
                            setFormData({ ...formData, requirements: formData.requirements.filter(r => r !== req.id) });
                          }
                        }}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        formData.requirements.includes(req.id) ? 'bg-primary-500 border-primary-500' : 'border-slate-700'
                      }`}>
                        {formData.requirements.includes(req.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{req.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="w-full px-6 py-4 btn-gradient text-white rounded-xl font-bold flex items-center justify-center space-x-3 transition-all disabled:opacity-50 active:scale-95 shadow-lg group"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Data...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 group-hover:animate-pulse" />
                    <span>Run Financial Projection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="col-span-2 space-y-6">
          {showResults && budget ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
                      <DollarSign className="w-7 h-7 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Gross Estimate</p>
                      <p className="text-2xl font-black text-white">₹{budget.total_estimated.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <PiggyBank className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Efficiency Gain</p>
                      <p className="text-2xl font-black text-green-400">₹{budget.savings_potential.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="dark-card-bg rounded-2xl p-6 border border-slate-800/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-accent-500/10 rounded-xl border border-accent-500/20">
                      <TrendingDown className="w-7 h-7 text-accent-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Optimized Core</p>
                      <p className="text-2xl font-black text-accent-400">
                        ₹{(budget.total_estimated - budget.savings_potential).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Breakdown */}
                <div className="dark-card-bg rounded-3xl p-8 border border-slate-800/50 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-xl text-white tracking-tight">Allocation Matrix</h3>
                    <button className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all border border-slate-700/50">
                      <Download className="w-4 h-4 mr-2 inline-block" />
                      Export
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {budget.breakdown.map((item) => (
                      <div key={item.category} className="group overflow-hidden rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                        <button
                          onClick={() => item.alternatives && toggleExpanded(item.category)}
                          className={`w-full flex items-center justify-between p-5 transition-all ${
                            expandedItems.includes(item.category) ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                            <span className="font-bold text-slate-200">{item.category}</span>
                            {item.alternatives && item.alternatives.length > 0 && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter bg-accent-500/10 text-accent-400 border border-accent-500/20 rounded-md">
                                Optimization Lab
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="font-black text-white">₹{item.total.toLocaleString()}</span>
                            {item.alternatives && (
                              <div className={`p-1 rounded-full transition-transform duration-300 ${expandedItems.includes(item.category) ? 'rotate-180 bg-slate-700' : 'bg-slate-800'}`}>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                        </button>
                        
                        {expandedItems.includes(item.category) && item.alternatives && (
                          <div className="p-5 bg-slate-900/40 border-t border-slate-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-slate-500 font-medium">Model: {item.item}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Strategic Alternatives:</p>
                              {item.alternatives.map((alt, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-green-500/20 transition-all">
                                  <span className="text-sm font-bold text-slate-300">{alt.item}</span>
                                  <div className="flex items-center text-green-400 font-black text-xs">
                                    <TrendingDown className="w-3 h-3 mr-1.5" />
                                    {alt.savings ? `- ₹${alt.savings}` : `-${alt.savings_percent}%`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart & Tips */}
                <div className="space-y-6">
                  <div className="dark-card-bg rounded-3xl p-8 border border-slate-800/50">
                    <h3 className="font-bold text-lg text-white mb-2 tracking-tight">Financial Surface</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          stroke="none"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                          formatter={(value: number) => `₹${value.toLocaleString()}`} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                       {chartData.map((entry, i) => (
                         <div key={i} className="flex items-center space-x-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl p-8 border border-primary-500/20 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                      <Lightbulb className="w-24 h-24 text-primary-400" />
                    </div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-primary-400/20 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-primary-400" />
                      </div>
                      <h3 className="font-bold text-white tracking-tight">AI Strategies</h3>
                    </div>
                    <ul className="space-y-4">
                      {budget.optimization_tips.map((tip, i) => (
                        <li key={i} className="flex items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 mr-3 flex-shrink-0 animate-pulse" />
                          <p className="text-sm font-medium text-slate-300 leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="dark-card-bg rounded-3xl p-20 border border-slate-800/50 text-center shadow-2xl">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-800">
                <Calculator className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Awaiting Parameters</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">Define your operational scope to generate a strategic financial blueprint.</p>
              <div className="mt-8 inline-flex items-center px-4 py-2 bg-primary-500/5 text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-500/10">
                Ready for analysis
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
