import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  LayoutDashboard, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  MessageSquare, 
  Activity,
  Workflow,
  Lock,
  Sparkles,
  ChevronRight,
  Play,
  Search,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const floatAnimation = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "execution",
      title: "Agile Execution",
      icon: LayoutDashboard,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">End-to-End Sprint Management</h3>
          <p className="text-slate-600">Plan sprints, manage backlogs, and execute on Kanban boards with granular task tracking and automated velocity forecasting.</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Customizable Kanban Boards</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Granular Task & Subtask Management</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Intelligent Sprint Capacity Planning</li>
          </ul>
        </div>
      )
    },
    {
      id: "analytics",
      title: "Operational Analytics",
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">Real-time Sprint Intelligence</h3>
          <p className="text-slate-600">Gain deep insights into team performance with live burndown charts, workload distribution panels, and sprint health metrics.</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Team Workload Distribution</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Automated Burndown Charts</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Live Sprint Health Status</li>
          </ul>
        </div>
      )
    },
    {
      id: "security",
      title: "Enterprise Security",
      icon: Shield,
      content: (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">Built for Enterprise Scale</h3>
          <p className="text-slate-600">Secure your operations with strict Role-Based Access Control (Admin, PM, Developer) and comprehensive organizational audit logs.</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Granular RBAC Permissions</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Organization-wide Audit Logs</li>
            <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-600" /> Global Activity Feeds</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Innonsh SprintOS</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
          >
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#collaboration" className="hover:text-indigo-600 transition">Realtime Collaboration</a>
            <a href="#analytics" className="hover:text-indigo-600 transition">Solutions</a>
            <a href="#security" className="hover:text-indigo-600 transition">Security</a>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/signin">
              <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm rounded-full px-6 font-medium transition-transform hover:scale-105 active:scale-95">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative">
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-50/80 via-violet-50/40 to-transparent -z-10" />
        
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-[80px] -z-10" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-[10%] w-[500px] h-[500px] bg-violet-300/20 rounded-full blur-[100px] -z-10" 
        />
        
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-indigo-700 border border-indigo-100 text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span>SprintOS Enterprise Edition</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 leading-[1.1]">
              Execution Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Collaboration.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Manage projects, sprints, realtime communication, blockers, analytics, and operational workflows from one intelligent platform.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signin">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-full font-medium transition-transform hover:-translate-y-1 hover:shadow-xl">
                  Enter Workspace <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm rounded-full font-medium transition-transform hover:-translate-y-1">
                <Play className="mr-2 w-4 h-4 fill-slate-700" /> Watch Platform Overview
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="container mx-auto mt-24 relative z-10 max-w-6xl perspective-[2000px]"
        >
          <motion.div 
            variants={floatAnimation}
            animate="animate"
            className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-2 shadow-2xl shadow-indigo-900/10 overflow-hidden ring-1 ring-slate-100"
          >
            <div className="h-10 flex items-center gap-2 px-4 mb-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="ml-4 flex-1 flex justify-center">
                <div className="h-6 w-64 bg-white rounded-md border border-slate-200 shadow-sm flex items-center px-3">
                  <Lock className="w-3 h-3 text-slate-400 mr-2" />
                  <span className="text-xs text-slate-500 font-medium">app.sprintos.com/dashboard</span>
                </div>
              </div>
            </div>
            <div className="aspect-[16/9] bg-slate-50 rounded-b-xl overflow-hidden relative border border-slate-100 flex">
              {/* Fake Sidebar */}
              <div className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center"><Zap className="w-3 h-3 text-white"/></div>
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2 py-1.5 bg-indigo-50 rounded-md">
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <div className="h-3 w-20 bg-indigo-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-2 py-1.5 opacity-60">
                    <Workflow className="w-4 h-4 text-slate-500" />
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3 px-2 py-1.5 opacity-60">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
              {/* Fake Main Content */}
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden relative">
                <div className="flex justify-between items-center">
                   <div>
                     <div className="h-6 w-40 bg-slate-800 rounded mb-2"></div>
                     <div className="h-3 w-64 bg-slate-400 rounded"></div>
                   </div>
                   <div className="h-8 w-32 bg-indigo-600 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Sprint Health Panel Mock */}
                  <motion.div whileHover={{ scale: 1.02 }} className="h-28 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-20 bg-slate-300 rounded"></div>
                      <Activity className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="h-8 w-16 bg-slate-800 rounded"></div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-3/4"></div>
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="h-28 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-24 bg-slate-300 rounded"></div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="h-8 w-12 bg-slate-800 rounded"></div>
                    <div className="flex gap-1">
                      <div className="h-2 flex-1 bg-emerald-500 rounded-full"></div>
                      <div className="h-2 flex-1 bg-amber-400 rounded-full"></div>
                      <div className="h-2 flex-1 bg-slate-100 rounded-full"></div>
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="h-28 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-24 bg-slate-300 rounded"></div>
                      <Lock className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="h-8 w-8 bg-slate-800 rounded"></div>
                    <div className="h-3 w-24 bg-rose-100 rounded text-[8px] text-rose-600 flex items-center px-1 font-bold">2 Critical</div>
                  </motion.div>
                </div>
                {/* Team Workload Panel Mock */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-4 w-32 bg-slate-800 rounded"></div>
                    <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="space-y-4 flex-1">
                    {[60, 85, 40].map((w, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <div className="h-3 w-24 bg-slate-600 rounded"></div>
                            <div className="h-3 w-8 bg-slate-400 rounded"></div>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${w}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className={`h-full ${w > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent flex items-end justify-center pb-12 pointer-events-none">
                <span className="text-sm font-semibold tracking-widest text-indigo-700 uppercase bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-indigo-100 shadow-sm">Interactive Dashboard Preview</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Bar Section */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8">Built for modern operational teams</p>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500"
          >
             {[
               { icon: Activity, label: "Realtime Architecture" },
               { icon: Shield, label: "Enterprise Security" },
               { icon: Workflow, label: "Scalable Workflows" },
               { icon: Sparkles, label: "AI-Ready" }
             ].map((item, i) => (
               <motion.div key={i} variants={fadeIn} className="flex items-center gap-2 font-bold text-xl text-slate-800">
                 <item.icon className="w-6 h-6 text-indigo-600" /> {item.label}
               </motion.div>
             ))}
          </motion.div>
        </div>
      </section>

      {/* Platform Overview Bento Box Section */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Everything you need to execute.</h2>
            <p className="text-slate-600 text-lg">A unified platform combining task management, real-time communication, and enterprise analytics.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto auto-rows-[300px]">
            {/* Bento Block 1: Global Search (Span 2 cols) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 md:row-span-1 rounded-3xl bg-white border border-slate-200 shadow-sm p-8 overflow-hidden relative group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">Deep Global Search</h3>
                <p className="text-slate-600 max-w-xs">Instantly find tasks, messages, projects, and users across your entire organization.</p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-64 h-64 bg-slate-50 rounded-tl-2xl border-t border-l border-slate-200 shadow-xl p-4 flex flex-col gap-3 group-hover:translate-x-[15%] group-hover:translate-y-[15%] transition-transform duration-500">
                <div className="h-10 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center px-3">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <div className="h-3 w-32 bg-slate-200 rounded"></div>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 space-y-3">
                  <div className="flex gap-2 items-center"><div className="w-5 h-5 bg-indigo-100 rounded flex-shrink-0"></div><div className="h-2 w-24 bg-slate-200 rounded"></div></div>
                  <div className="flex gap-2 items-center"><div className="w-5 h-5 bg-violet-100 rounded flex-shrink-0"></div><div className="h-2 w-32 bg-slate-200 rounded"></div></div>
                  <div className="flex gap-2 items-center"><div className="w-5 h-5 bg-emerald-100 rounded flex-shrink-0"></div><div className="h-2 w-20 bg-slate-200 rounded"></div></div>
                </div>
              </div>
            </motion.div>

            {/* Bento Block 2: Standups */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="md:col-span-1 md:row-span-1 rounded-3xl bg-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-600/20 p-8 overflow-hidden relative text-white"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Automated Standups</h3>
              <p className="text-indigo-100 text-sm">Async daily updates and blocker tracking.</p>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </motion.div>

            {/* Bento Block 3: Security */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="md:col-span-1 md:row-span-2 rounded-3xl bg-white border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Role-Based Access</h3>
              <p className="text-slate-600 text-sm mb-6">Granular permissions for Product Managers, Developers, and Admins to ensure strict security.</p>
              
              <div className="w-full space-y-2 mt-auto">
                <div className="h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between px-3">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-xs font-semibold text-slate-700">Admin</span></div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between px-3">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-xs font-semibold text-slate-700">Manager</span></div>
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </motion.div>

            {/* Bento Block 4: Blocker Escalation */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="md:col-span-1 md:row-span-1 rounded-3xl bg-rose-50 border border-rose-100 shadow-sm p-8 overflow-hidden relative group"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-rose-900">Blocker Escalation</h3>
              <p className="text-rose-700 text-sm">Instantly flag and route blockers to stakeholders.</p>
            </motion.div>

            {/* Bento Block 5: Analytics & Reports (Span 2 cols) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 md:row-span-1 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-8 overflow-hidden relative group text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
              <div className="flex flex-col md:flex-row gap-6 items-center h-full relative z-10">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Live Analytics Engine</h3>
                  <p className="text-slate-400 text-sm">Track team velocity, workload distribution, and sprint health in real-time.</p>
                </div>
                <div className="w-48 h-32 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl p-4 flex flex-col justify-end gap-2 group-hover:scale-105 transition-transform">
                  <div className="flex items-end gap-2 h-full">
                    <div className="w-full bg-indigo-500/40 rounded-t-sm h-[30%]"></div>
                    <div className="w-full bg-indigo-500/60 rounded-t-sm h-[60%]"></div>
                    <div className="w-full bg-indigo-500 rounded-t-sm h-[90%]"></div>
                    <div className="w-full bg-emerald-500 rounded-t-sm h-[75%]"></div>
                  </div>
                  <div className="h-1 w-full bg-slate-700 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Deep Dive Section */}
      <section id="security" className="py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Interactive Tabs */}
            <div className="w-full md:w-1/3 flex flex-col gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`w-full text-left p-6 rounded-2xl transition-all duration-300 flex items-center gap-4 ${
                    activeTab === index 
                      ? "bg-slate-50 border border-slate-200 shadow-sm" 
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    activeTab === index ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-slate-100 text-slate-500"
                  }`}>
                    <tab.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`font-bold ${activeTab === index ? "text-slate-900" : "text-slate-600"}`}>{tab.title}</h4>
                  </div>
                </button>
              ))}
            </div>

            {/* Tab Content Display */}
            <div className="w-full md:w-2/3">
              <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200 min-h-[400px] flex items-center relative overflow-hidden">
                {/* Decorative background flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-[80px] -z-10 opacity-50"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    {tabs[activeTab].content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contextual Chat System */}
      <section id="collaboration" className="py-32 bg-white overflow-hidden relative">
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-violet-100 rounded-full blur-[100px] opacity-60 -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 lg:pr-12">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold mb-6">
                  <MessageSquare className="w-4 h-4" /> Contextual Collaboration
                </motion.div>
                <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
                  Communication linked directly to execution.
                </motion.h2>
                <motion.p variants={fadeIn} className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Stop losing context across different apps. SprintOS brings your team's conversations directly into the tasks and sprints where the work is actually happening.
                </motion.p>
                
                <motion.ul variants={fadeIn} className="space-y-4 mb-10">
                  {['Task discussion threads', 'Realtime blockers & mentions', 'Operational announcements', 'Live status updates'].map((item, i) => (
                    <motion.li key={i} whileHover={{ x: 5 }} className="flex items-center gap-3 text-slate-700 font-medium transition-transform cursor-default">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
                
                <motion.div variants={fadeIn}>
                  <Link to="/signin" className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group">
                    Explore Collaboration Features 
                    <motion.div className="inline-block ml-1" animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
            
            <div className="flex-1 w-full max-w-xl lg:max-w-none relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-[3rem] transform rotate-3 scale-105 -z-10 blur-xl opacity-50"></div>
              <motion.div 
                initial={{ opacity: 0, x: 40, rotateY: 10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform-gpu"
              >
                <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4">
                  <div className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> # API-Integration-Epic
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50 space-y-6">
                  {/* Mock Chat bubbles */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">RD</div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-slate-900">Rahul Desai</span>
                        <span className="text-xs text-slate-500">10:42 AM</span>
                      </div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        I've just pushed the new endpoint for the auth flow. Can someone review <span className="text-indigo-600 font-medium bg-indigo-50 px-1 rounded">TASK-442</span>?
                      </div>
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold flex-shrink-0">PS</div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-slate-900">Priya Sharma</span>
                        <span className="text-xs text-slate-500">10:45 AM</span>
                      </div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        Looking at it now. Also, <span className="text-indigo-600 font-medium">@Rahul</span>, we need to escalate the DB blocker on <span className="text-indigo-600 font-medium bg-indigo-50 px-1 rounded">TASK-445</span>.
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3"
                        >
                           <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><Lock className="w-4 h-4" /></div>
                           <div>
                             <p className="text-sm font-semibold text-rose-900">Blocker Escalated</p>
                             <p className="text-xs text-rose-700">Database migration permissions missing</p>
                           </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Showcase */}
      <section id="solutions" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] -z-10" />
        
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">The Operating System for Execution</h2>
            <p className="text-slate-400 text-lg">A seamless, step-by-step workflow designed for high-velocity teams.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Desktop connecting lines */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-800 -translate-y-1/2 -z-10 overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                whileInView={{ x: "100%" }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                className="w-full h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            </div>
            
            {[
              { step: "01", title: "Create Sprint", desc: "Define goals, allocate resources, and balance workload intuitively." },
              { step: "02", title: "Collaborate in Realtime", desc: "Discuss tasks, mention teammates, and resolve issues instantly." },
              { step: "03", title: "Deliver Faster", desc: "Track progress visually, clear blockers, and ship on time." }
            ].map((phase, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center relative group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-indigo-500 text-indigo-400 flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  {phase.step}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">{phase.title}</h3>
                <p className="text-slate-400">{phase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50/30" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-br from-indigo-400/20 to-violet-400/20 blur-[100px] rounded-full -z-10" 
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.h2 variants={fadeIn} className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 tracking-tight">Run Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Without Chaos.</span></motion.h2>
            <motion.p variants={fadeIn} className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Bring execution, collaboration, and operational intelligence into one unified workspace.
            </motion.p>
            <motion.div variants={fadeIn}>
              <Link to="/signin">
                <Button size="lg" className="h-14 px-10 text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
                  Enter SprintOS Workspace <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 pt-16 pb-8 text-sm text-slate-600 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-lg text-slate-900">Innonsh SprintOS</span>
              </div>
              <p className="text-slate-500 max-w-sm mb-6">
                The enterprise execution operating system. Run sprints, manage teams, and scale operations effortlessly.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2026 Innonsh Technologies. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
