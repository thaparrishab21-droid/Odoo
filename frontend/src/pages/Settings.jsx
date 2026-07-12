import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Database, 
  Sliders, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Global settings state
  const [weights, setWeights] = useState({ environmental: 40, social: 30, governance: 30 });
  const [toggles, setToggles] = useState({
    evidenceRequired: true,
    autoCarbon: true,
    autoBadge: true
  });
  const [weightsError, setWeightsError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Main Tab: 'profile' | 'weights' | 'master_data'
  const [activeMainTab, setActiveMainTab] = useState('weights');
  
  // Master data state
  const [activeEntity, setActiveEntity] = useState('departments');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Dropdown list cache for relational inputs (e.g. category list, department list)
  const [dropdowns, setDropdowns] = useState({ departments: [], categories: [] });

  // List of master data models
  const entities = [
    { key: 'departments', label: 'Departments', searchFields: ['name', 'description'] },
    { key: 'categories', label: 'ESG Categories', searchFields: ['name', 'description'] },
    { key: 'emission-factors', label: 'Emission Factors', searchFields: ['name', 'unit'] },
    { key: 'environmental-goals', label: 'Environmental Goals', searchFields: ['name', 'unit'] },
    { key: 'product-esg-profiles', label: 'Product ESG Profiles', searchFields: ['name'] },
    { key: 'policies', label: 'Corporate Policies', searchFields: ['title', 'content'] },
    { key: 'rewards', label: 'Reward Catalog', searchFields: ['name', 'description'] },
    { key: 'badges', label: 'Gamification Badges', searchFields: ['name', 'description'] },
    { key: 'challenges', label: 'Challenges Arena', searchFields: ['title', 'description'] },
    { key: 'employees', label: 'Employees & Roles', searchFields: ['name', 'email'] }
  ];

  // Fetch helper
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/${activeEntity}`, {
        params: {
          page: page,
          per_page: 5,
          search: search
        }
      });
      setItems(response.data.items);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
    } catch (err) {
      console.error("Error fetching master data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeEntity, page, search]);

  // Load static dropdown dependencies for relational forms
  const fetchDropdowns = async () => {
    try {
      const deptsRes = await api.get('/departments', { params: { per_page: 100 } });
      const catsRes = await api.get('/categories', { params: { per_page: 100 } });
      setDropdowns({
        departments: deptsRes.data.items,
        categories: catsRes.data.items
      });
    } catch (e) {
      console.warn("Dropdown loading warning:", e);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'master_data') {
      fetchItems();
    }
  }, [activeMainTab, activeEntity, page, search, fetchItems]);

  useEffect(() => {
    if (activeMainTab === 'master_data') {
      fetchDropdowns();
    }
  }, [activeMainTab, activeEntity]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleEntityChange = (entityKey) => {
    setActiveEntity(entityKey);
    setSearch('');
    setPage(1);
    setSelectedItem(null);
  };

  // Validates weights configuration
  const handleSaveWeights = (e) => {
    e.preventDefault();
    setWeightsError('');
    setSaveSuccess(false);

    const sum = Number(weights.environmental) + Number(weights.social) + Number(weights.governance);
    if (sum !== 100) {
      setWeightsError(`Configuration must sum to 100%. Current sum: ${sum}%`);
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Renders dynamic form fields based on the selected master data entity
  const renderFormFields = () => {
    const errorText = (field) => formErrors[field] ? (
      <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors[field]}</span>
    ) : null;

    const inputClass = "w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100";

    switch (activeEntity) {
      case 'departments':
      case 'categories':
        return (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
              <input 
                type="text" 
                required
                className={inputClass}
                value={formValues.name || ''}
                onChange={(e) => setFormValues({...formValues, name: e.target.value})}
              />
              {errorText('name')}
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea 
                className={inputClass}
                rows={3}
                value={formValues.description || ''}
                onChange={(e) => setFormValues({...formValues, description: e.target.value})}
              />
            </div>
          </>
        );

      case 'emission-factors':
        return (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Factor Title</label>
              <input 
                type="text" 
                required
                className={inputClass}
                value={formValues.name || ''}
                onChange={(e) => setFormValues({...formValues, name: e.target.value})}
              />
              {errorText('name')}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coefficient Factor</label>
                <input 
                  type="number" 
                  step="0.0001"
                  required
                  className={inputClass}
                  value={formValues.factor || ''}
                  onChange={(e) => setFormValues({...formValues, factor: parseFloat(e.target.value)})}
                />
                {errorText('factor')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metric Unit</label>
                <input 
                  type="text" 
                  placeholder="e.g. kWh, L"
                  required
                  className={inputClass}
                  value={formValues.unit || ''}
                  onChange={(e) => setFormValues({...formValues, unit: e.target.value})}
                />
                {errorText('unit')}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ESG Category</label>
              <select 
                required
                className={inputClass}
                value={formValues.category_id || ''}
                onChange={(e) => setFormValues({...formValues, category_id: parseInt(e.target.value)})}
              >
                <option value="">Select Category...</option>
                {dropdowns.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errorText('category_id')}
            </div>
          </>
        );

      case 'environmental-goals':
        return (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goal Target Title</label>
              <input 
                type="text" 
                required
                className={inputClass}
                value={formValues.name || ''}
                onChange={(e) => setFormValues({...formValues, name: e.target.value})}
              />
              {errorText('name')}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Threshold</label>
                <input 
                  type="number" 
                  required
                  className={inputClass}
                  value={formValues.target_value || ''}
                  onChange={(e) => setFormValues({...formValues, target_value: parseFloat(e.target.value)})}
                />
                {errorText('target_value')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metric Unit</label>
                <input 
                  type="text" 
                  required
                  className={inputClass}
                  value={formValues.unit || ''}
                  onChange={(e) => setFormValues({...formValues, unit: e.target.value})}
                />
                {errorText('unit')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                <input 
                  type="date" 
                  required
                  className={inputClass}
                  value={formValues.start_date || ''}
                  onChange={(e) => setFormValues({...formValues, start_date: e.target.value})}
                />
                {errorText('start_date')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Date</label>
                <input 
                  type="date" 
                  required
                  className={inputClass}
                  value={formValues.target_date || ''}
                  onChange={(e) => setFormValues({...formValues, target_date: e.target.value})}
                />
                {errorText('target_date')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select 
                  required
                  className={inputClass}
                  value={formValues.category_id || ''}
                  onChange={(e) => setFormValues({...formValues, category_id: parseInt(e.target.value)})}
                >
                  <option value="">Select...</option>
                  {dropdowns.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errorText('category_id')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department (Optional)</label>
                <select 
                  className={inputClass}
                  value={formValues.department_id || ''}
                  onChange={(e) => setFormValues({...formValues, department_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">Corporate Wide</option>
                  {dropdowns.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </>
        );

      case 'product-esg-profiles':
        return (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
              <input 
                type="text" 
                required
                className={inputClass}
                value={formValues.name || ''}
                onChange={(e) => setFormValues({...formValues, name: e.target.value})}
              />
              {errorText('name')}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carbon footprint</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  className={inputClass}
                  value={formValues.carbon_footprint || ''}
                  onChange={(e) => setFormValues({...formValues, carbon_footprint: parseFloat(e.target.value)})}
                />
                {errorText('carbon_footprint')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Score (0-10)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  className={inputClass}
                  value={formValues.social_score || ''}
                  onChange={(e) => setFormValues({...formValues, social_score: parseFloat(e.target.value)})}
                />
                {errorText('social_score')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gov Score (0-10)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  className={inputClass}
                  value={formValues.governance_score || ''}
                  onChange={(e) => setFormValues({...formValues, governance_score: parseFloat(e.target.value)})}
                />
                {errorText('governance_score')}
              </div>
            </div>
          </>
        );

      case 'policies':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Policy Title</label>
                <input 
                  type="text" 
                  required
                  className={inputClass}
                  value={formValues.title || ''}
                  onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                />
                {errorText('title')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Effective Date</label>
                <input 
                  type="date" 
                  required
                  className={inputClass}
                  value={formValues.effective_date || ''}
                  onChange={(e) => setFormValues({...formValues, effective_date: e.target.value})}
                />
                {errorText('effective_date')}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Guidelines</label>
              <textarea 
                required
                className={inputClass}
                rows={4}
                value={formValues.content || ''}
                onChange={(e) => setFormValues({...formValues, content: e.target.value})}
              />
              {errorText('content')}
            </div>
          </>
        );

      case 'rewards':
        return (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name</label>
              <input 
                type="text" 
                required
                className={inputClass}
                value={formValues.name || ''}
                onChange={(e) => setFormValues({...formValues, name: e.target.value})}
              />
              {errorText('name')}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points cost</label>
                <input 
                  type="number" 
                  required
                  className={inputClass}
                  value={formValues.points_cost || ''}
                  onChange={(e) => setFormValues({...formValues, points_cost: parseInt(e.target.value)})}
                />
                {errorText('points_cost')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Required Cost</label>
                <input 
                  type="number" 
                  required
                  className={inputClass}
                  value={formValues.xp_required || ''}
                  onChange={(e) => setFormValues({...formValues, xp_required: parseInt(e.target.value) || 0})}
                />
                {errorText('xp_required')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Stock</label>
                <input 
                  type="number" 
                  required
                  className={inputClass}
                  value={formValues.stock || ''}
                  onChange={(e) => setFormValues({...formValues, stock: parseInt(e.target.value)})}
                />
                {errorText('stock')}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Details</label>
              <textarea 
                className={inputClass}
                rows={2}
                value={formValues.description || ''}
                onChange={(e) => setFormValues({...formValues, description: e.target.value})}
              />
            </div>
          </>
        );

      case 'badges':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Badge Name</label>
                <input 
                  type="text" 
                  required
                  className={inputClass}
                  value={formValues.name || ''}
                  onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                />
                {errorText('name')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Requirement</label>
                <input 
                  type="number" 
                  required
                  className={inputClass}
                  value={formValues.xp_required || ''}
                  onChange={(e) => setFormValues({...formValues, xp_required: parseInt(e.target.value)})}
                />
                {errorText('xp_required')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lucide Icon Class</label>
                <input 
                  type="text" 
                  placeholder="e.g. leaf, trophy"
                  required
                  className={inputClass}
                  value={formValues.icon_name || ''}
                  onChange={(e) => setFormValues({...formValues, icon_name: e.target.value})}
                />
                {errorText('icon_name')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unlock Rule (e.g. xp &gt;= 300)</label>
                <input 
                  type="text" 
                  placeholder="e.g. xp >= 300"
                  className={inputClass}
                  value={formValues.unlock_rule || ''}
                  onChange={(e) => setFormValues({...formValues, unlock_rule: e.target.value})}
                />
                {errorText('unlock_rule')}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unlock Details</label>
              <textarea 
                className={inputClass}
                rows={2}
                value={formValues.description || ''}
                onChange={(e) => setFormValues({...formValues, description: e.target.value})}
              />
            </div>
          </>
        );

      case 'challenges':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Challenge Title</label>
                <input 
                  type="text" 
                  required
                  className={inputClass}
                  value={formValues.title || ''}
                  onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                />
                {errorText('title')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select 
                  className={inputClass}
                  value={formValues.category_id || ''}
                  onChange={(e) => setFormValues({...formValues, category_id: e.target.value ? parseInt(e.target.value) : ''})}
                >
                  <option value="">Select Category...</option>
                  {dropdowns.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errorText('category_id')}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                <select 
                  className={inputClass}
                  value={formValues.difficulty || 'Medium'}
                  onChange={(e) => setFormValues({...formValues, difficulty: e.target.value})}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                {errorText('difficulty')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Reward</label>
                <input 
                  type="number" 
                  required
                  className={inputClass}
                  value={formValues.xp_reward !== undefined ? formValues.xp_reward : (formValues.xp || '')}
                  onChange={(e) => setFormValues({...formValues, xp_reward: parseInt(e.target.value) || 0, xp: parseInt(e.target.value) || 0})}
                />
                {errorText('xp_reward')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select 
                  className={inputClass}
                  value={formValues.status || 'Draft'}
                  onChange={(e) => setFormValues({...formValues, status: e.target.value})}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
                {errorText('status')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline Date</label>
                <input 
                  type="date" 
                  required
                  className={inputClass}
                  value={formValues.deadline || (formValues.end_date || '')}
                  onChange={(e) => setFormValues({...formValues, deadline: e.target.value, end_date: e.target.value, start_date: formValues.start_date || new Date().toISOString().split('T')[0]})}
                />
                {errorText('deadline')}
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input 
                  type="checkbox" 
                  id="evidence_required"
                  className="rounded text-emerald-500 focus:ring-emerald-500 border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950 w-4 h-4"
                  checked={!!formValues.evidence_required}
                  onChange={(e) => setFormValues({...formValues, evidence_required: e.target.checked})}
                />
                <label htmlFor="evidence_required" className="text-xs text-slate-600 dark:text-slate-400 font-semibold select-none cursor-pointer">
                  Evidence Proof Required
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <textarea 
                className={inputClass}
                rows={2}
                value={formValues.description || ''}
                onChange={(e) => setFormValues({...formValues, description: e.target.value})}
              />
            </div>
          </>
        );

      case 'employees':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</label>
                <input 
                  type="text" 
                  required
                  className={inputClass}
                  value={formValues.name || ''}
                  onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                />
                {errorText('name')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  className={inputClass}
                  value={formValues.email || ''}
                  onChange={(e) => setFormValues({...formValues, email: e.target.value})}
                />
                {errorText('email')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {selectedItem ? 'New Password (Optional)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  required={!selectedItem}
                  className={inputClass}
                  value={formValues.password || ''}
                  onChange={(e) => setFormValues({...formValues, password: e.target.value})}
                />
                {errorText('password')}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <select 
                  required
                  className={inputClass}
                  value={formValues.role || ''}
                  onChange={(e) => setFormValues({...formValues, role: e.target.value})}
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
                {errorText('role')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                <select 
                  className={inputClass}
                  value={formValues.department_id || ''}
                  onChange={(e) => setFormValues({...formValues, department_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">Unassigned</option>
                  {dropdowns.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Triggers Add record modal opening
  const openAddModal = () => {
    setSelectedItem(null);
    setFormErrors({});
    setApiError('');
    
    // Set default keys
    if (activeEntity === 'employees') {
      setFormValues({ role: 'Employee', department_id: null });
    } else if (activeEntity === 'emission-factors' || activeEntity === 'environmental-goals') {
      setFormValues({ category_id: '' });
    } else {
      setFormValues({});
    }
    
    setModalOpen(true);
  };

  // Triggers Edit modal opening
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormErrors({});
    setApiError('');
    
    // Copy item values
    const vals = { ...item };
    if (activeEntity === 'employees') {
      vals.password = ''; // Don't bind password hashes
    }
    
    setFormValues(vals);
    setModalOpen(true);
  };

  // Saves record changes
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setApiError('');

    try {
      if (selectedItem) {
        // PUT update
        await api.put(`/${activeEntity}/${selectedItem.id}`, formValues);
      } else {
        // POST create
        await api.post(`/${activeEntity}`, formValues);
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setApiError(err.response?.data?.message || "An unexpected error occurred.");
      }
    }
  };

  // Triggers Delete modal opening
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setApiError('');
    setDeleteModalOpen(true);
  };

  // Executes delete
  const handleDeleteRecord = async () => {
    setApiError('');
    try {
      await api.delete(`/${activeEntity}/${selectedItem.id}`);
      setDeleteModalOpen(false);
      setPage(1);
      fetchItems();
    } catch (err) {
      setApiError(err.response?.data?.message || "Cannot delete resource due to reference constraints.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & Configurations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure carbon coefficients, weights, organization settings, and manage master database directories.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveMainTab('weights')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeMainTab === 'weights' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Sliders className="w-4 h-4 mr-2" />
          ESG Weights & Constants
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveMainTab('master_data')}
            className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeMainTab === 'master_data' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Database className="w-4 h-4 mr-2" />
            Master Directories Admin
          </button>
        )}
      </div>

      {/* Main Tab Views */}
      <div className="mt-4">
        
        {/* VIEW 1: ESG WEIGHTS CONFIGURATION */}
        {activeMainTab === 'weights' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Configuration Form */}
            <form onSubmit={handleSaveWeights} className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">ESG Valuation Weights</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Define the relative weights used to compile organizational metrics. Total must sum to 100%.</p>
              </div>

              {saveSuccess && (
                <div className="flex items-center space-x-2.5 p-3.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>ESG weight parameters successfully saved to system profile.</span>
                </div>
              )}

              {weightsError && (
                <div className="flex items-center space-x-2.5 p-3.5 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{weightsError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environmental (E)</label>
                  <div className="relative mt-2">
                    <input 
                      type="number" 
                      required
                      disabled={!isAdmin}
                      className="w-full pr-8 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100"
                      value={weights.environmental}
                      onChange={(e) => setWeights({...weights, environmental: parseInt(e.target.value) || 0})}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social (S)</label>
                  <div className="relative mt-2">
                    <input 
                      type="number" 
                      required
                      disabled={!isAdmin}
                      className="w-full pr-8 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100"
                      value={weights.social}
                      onChange={(e) => setWeights({...weights, social: parseInt(e.target.value) || 0})}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Governance (G)</label>
                  <div className="relative mt-2">
                    <input 
                      type="number" 
                      required
                      disabled={!isAdmin}
                      className="w-full pr-8 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100"
                      value={weights.governance}
                      onChange={(e) => setWeights({...weights, governance: parseInt(e.target.value) || 0})}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2">
                  <button 
                    type="submit"
                    className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:translate-y-px transition-all"
                  >
                    Save ESG Settings
                  </button>
                </div>
              )}
            </form>

            {/* Right: Toggle options */}
            <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">System Flags</h3>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold">Evidence Upload Required</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Enforce photo/doc proofs for CSR events.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    disabled={!isAdmin}
                    className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded border-slate-300"
                    checked={toggles.evidenceRequired}
                    onChange={(e) => setToggles({...toggles, evidenceRequired: e.target.checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold">Automatic Carbon Estimates</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Auto-calculate footprint using grid multipliers.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    disabled={!isAdmin}
                    className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded border-slate-300"
                    checked={toggles.autoCarbon}
                    onChange={(e) => setToggles({...toggles, autoCarbon: e.target.checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold">Auto badge awarding</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Grant badges immediately upon XP triggers.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    disabled={!isAdmin}
                    className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded border-slate-300"
                    checked={toggles.autoBadge}
                    onChange={(e) => setToggles({...toggles, autoBadge: e.target.checked})}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: MASTER DIRECTORIES DATA MANAGEMENT */}
        {activeMainTab === 'master_data' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left: Resource sub-navigation */}
            <div className="p-4 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">Database Directories</span>
              {entities.map(e => (
                <button
                  key={e.key}
                  onClick={() => handleEntityChange(e.key)}
                  className={`text-left px-3 py-2 text-xs font-medium rounded-xl transition-all ${activeEntity === e.key ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                >
                  {e.label}
                </button>
              ))}
            </div>

            {/* Right: Data Table and Search Controls */}
            <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {entities.find(e => e.key === activeEntity)?.label} Management
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Query, insert, update, and manage records.
                  </p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/10 active:translate-y-px transition-all flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1.5 shrink-0" />
                  Add Record
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full max-w-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Filter and search records..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>

              {/* Table Data View */}
              <div className="overflow-x-auto min-h-60">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mb-2" />
                    <span className="text-xs">Fetching records from SQLite...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Info className="w-7 h-7 mb-2 text-slate-300" />
                    <span className="text-xs font-semibold">No records found</span>
                    <span className="text-[10px] mt-0.5 text-slate-400">Try modifying your filter keyword or add a new record.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Name / Title</th>
                        <th className="py-2.5 px-3">Primary Info</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                          <td className="py-3 px-3 font-semibold text-slate-400">#{item.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.name || item.title || 'No Title'}
                            </span>
                            {item.email && <span className="text-[10px] text-slate-400 block mt-0.5">{item.email}</span>}
                          </td>
                          <td className="py-3 px-3">
                            {activeEntity === 'emission-factors' && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                                {item.factor} kg CO2e / {item.unit}
                              </span>
                            )}
                            {activeEntity === 'environmental-goals' && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                                Target: {item.target_value} {item.unit} (Current: {item.current_value})
                              </span>
                            )}
                            {activeEntity === 'product-esg-profiles' && (
                              <span className="text-emerald-500 font-bold">Overall: {item.overall_esg_score}</span>
                            )}
                            {activeEntity === 'rewards' && (
                              <span className="text-amber-500 font-bold">{item.points_cost} points / {item.xp_required} XP (Stock: {item.stock})</span>
                            )}
                            {activeEntity === 'badges' && (
                              <span className="text-indigo-500 font-semibold">{item.xp_required} XP (Rule: {item.unlock_rule})</span>
                            )}
                            {activeEntity === 'challenges' && (
                              <span className="text-emerald-500 font-semibold">{item.xp_reward} XP (Difficulty: {item.difficulty})</span>
                            )}
                            {activeEntity === 'employees' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-semibold">
                                {item.role}
                              </span>
                            )}
                            {item.description && !['rewards', 'badges', 'departments', 'categories', 'challenges'].includes(activeEntity) && (
                              <span className="text-slate-400 truncate block max-w-xs">{item.description}</span>
                            )}
                            {item.description && ['rewards', 'badges', 'departments', 'categories', 'challenges'].includes(activeEntity) && (
                              <span className="text-slate-405 block max-w-xs">{item.description}</span>
                            )}
                            {item.content && (
                              <span className="text-slate-400 truncate block max-w-xs">{item.content}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            <button 
                              onClick={() => openEditModal(item)}
                              title="Edit Record"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all inline-block"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(item)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all inline-block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">Total: {totalItems} items</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold">{page} of {totalPages}</span>
                    <button 
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: ADD / EDIT DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                {selectedItem ? 'Edit' : 'Create'} {entities.find(e => e.key === activeEntity)?.label.slice(0, -1)}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecord}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {apiError && (
                  <div className="flex items-center space-x-2.5 p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}
                {renderFormFields()}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-950/20 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 active:translate-y-px transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE DIALOG */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 text-center space-y-4">
            
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently delete this {entities.find(e => e.key === activeEntity)?.label.slice(0, -1).toLowerCase()}? This action cannot be undone.
              </p>
            </div>

            {apiError && (
              <div className="flex items-center space-x-2.5 p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button 
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteRecord}
                className="py-1.5 px-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/10 active:translate-y-px transition-all"
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
