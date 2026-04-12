import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Card, { CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, campaignAPI } from '../../services/api';
import { getAssetUrl, getGoogleMapsUrl } from '../../utils/helpers';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const campaignStatuses = ['draft', 'active', 'completed', 'cancelled'];
const roleOptions = ['volunteer', 'organizer'];
const defaultCenter = [33.5731, -7.5898];

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const roleToneMap = {
  admin: 'bg-amber-100 text-amber-700',
  organizer: 'bg-blue-100 text-blue-700',
  volunteer: 'bg-emerald-100 text-emerald-700',
};

const statusToneMap = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
};

const SparkIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3l2.094 6.406H22l-5.547 4.03 2.118 6.498L13 15.87 7.429 19.934l2.118-6.497L4 9.406h6.906L13 3z" />
  </svg>
);

const TeamIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a5 5 0 00-10 0v2M7 20H2v-2a3 3 0 013.356-2.857M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CampaignIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MetricCard = ({ label, value, hint, icon, tint }) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute inset-x-0 top-0 h-1 ${tint}`} />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-3 font-display text-3xl text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </Card>
);

const SectionTitle = ({ title, subtitle, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
    <div>
      <h2 className="font-display text-2xl text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
    {action}
  </div>
);

const EmptyPanel = ({ title, description }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
    <p className="font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-500 mt-2">{description}</p>
  </div>
);

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });

  return null;
};

const MapPicker = ({ latitude, longitude, onPick }) => {
  const hasCoordinates = latitude !== '' && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const position = hasCoordinates ? [Number(latitude), Number(longitude)] : defaultCenter;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <MapContainer center={position} zoom={hasCoordinates ? 13 : 6} scrollWheelZoom className="h-72 w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onPick} />
        {hasCoordinates && <Marker position={position} draggable eventHandlers={{ dragend: (event) => onPick(event.target.getLatLng()) }} />}
      </MapContainer>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [submittingOrganizer, setSubmittingOrganizer] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyCampaignId, setBusyCampaignId] = useState(null);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [campaignImageFile, setCampaignImageFile] = useState(null);
  const [campaignImagePreview, setCampaignImagePreview] = useState('');
  const [organizerForm, setOrganizerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    start_date: '',
    end_date: '',
    status: isAdmin ? 'active' : 'draft',
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'volunteer',
    is_active: true,
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [campaignAPI.getManageable()];
      if (isAdmin) requests.unshift(adminAPI.getOverview(), adminAPI.getUsers());

      const responses = await Promise.all(requests);

      if (isAdmin) {
        const [overviewResponse, usersResponse, campaignsResponse] = responses;
        setOverview(overviewResponse.data.data);
        setUsers(usersResponse.data.data.users);
        setCampaigns(campaignsResponse.data.data.campaigns);
      } else {
        setCampaigns(responses[0].data.data.campaigns);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load dashboard right now.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    return () => {
      if (campaignImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(campaignImagePreview);
      }
    };
  }, [campaignImagePreview]);

  const visibleUsers = useMemo(() => (
    users.filter((member) => {
      const matchesRole = userRoleFilter === 'all' || member.role === userRoleFilter;
      const term = userSearch.trim().toLowerCase();
      const matchesSearch = !term || [member.name, member.email, member.phone].some((value) => value?.toLowerCase().includes(term));
      return matchesRole && matchesSearch;
    })
  ), [users, userRoleFilter, userSearch]);

  const handleOrganizerChange = (event) => {
    const { name, value } = event.target;
    setOrganizerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCampaignChange = (event) => {
    const { name, value } = event.target;
    setCampaignForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCampaignImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setCampaignImageFile(file);

    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }

    setCampaignImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleMapPick = ({ lat, lng }) => {
    setCampaignForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const resetCampaignEditor = () => {
    setEditingCampaignId(null);
    setCampaignForm({
      title: '',
      description: '',
      location: '',
      latitude: '',
      longitude: '',
      start_date: '',
      end_date: '',
      status: isAdmin ? 'active' : 'draft',
    });
    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }
    setCampaignImageFile(null);
    setCampaignImagePreview('');
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignForm({
      title: campaign.title || '',
      description: campaign.description || '',
      location: campaign.location || '',
      latitude: campaign.latitude ?? '',
      longitude: campaign.longitude ?? '',
      start_date: campaign.start_date ? String(campaign.start_date).slice(0, 10) : '',
      end_date: campaign.end_date ? String(campaign.end_date).slice(0, 10) : '',
      status: campaign.status || 'draft',
    });
    if (campaignImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(campaignImagePreview);
    }
    setCampaignImageFile(null);
    setCampaignImagePreview(getAssetUrl(campaign.image_url) || '');
  };

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditUser = (member) => {
    setEditingUserId(member.id);
    setUserForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'volunteer',
      is_active: !!member.is_active,
    });
  };

  const resetUserEditor = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'volunteer',
      is_active: true,
    });
  };

  const handleCreateOrganizer = async (event) => {
    event.preventDefault();
    setSubmittingOrganizer(true);
    try {
      const response = await adminAPI.createOrganizer(organizerForm);
      toast.success(response.data.message || 'Organizer account created.');
      setOrganizerForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create organizer.');
    } finally {
      setSubmittingOrganizer(false);
    }
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    setSubmittingCampaign(true);
    try {
      const formData = new FormData();
      Object.entries(campaignForm).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });
      if (campaignImageFile) {
        formData.append('image', campaignImageFile);
      }

      const response = editingCampaignId
        ? await campaignAPI.update(editingCampaignId, formData)
        : await campaignAPI.create(formData);
      toast.success(response.data.message || `Campaign ${editingCampaignId ? 'updated' : 'created'} successfully.`);
      resetCampaignEditor();
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || `Could not ${editingCampaignId ? 'update' : 'create'} campaign.`);
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleToggleUserStatus = async (member) => {
    setBusyUserId(member.id);
    try {
      const response = await adminAPI.updateUserStatus(member.id, { is_active: !member.is_active });
      toast.success(response.data.message || 'User status updated.');
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = async (member, role) => {
    setBusyUserId(member.id);
    try {
      const response = await adminAPI.updateUserRole(member.id, { role });
      toast.success(response.data.message || 'User role updated.');
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user role.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleCampaignStatusChange = async (campaignId, status) => {
    setBusyCampaignId(campaignId);
    try {
      const response = await campaignAPI.updateStatus(campaignId, { status });
      toast.success(response.data.message || 'Campaign updated.');
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update campaign status.');
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.title}"? This action cannot be undone.`)) return;

    setBusyCampaignId(campaign.id);
    try {
      const response = await campaignAPI.remove(campaign.id);
      toast.success(response.data.message || 'Campaign deleted.');
      if (editingCampaignId === campaign.id) {
        resetCampaignEditor();
      }
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete campaign.');
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    if (!editingUserId) return;

    setSavingUser(true);
    try {
      const response = await adminAPI.updateUser(editingUserId, userForm);
      toast.success(response.data.message || 'User updated.');
      resetUserEditor();
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (member) => {
    if (!window.confirm(`Delete user "${member.name}"? This action cannot be undone.`)) return;

    setBusyUserId(member.id);
    try {
      const response = await adminAPI.deleteUser(member.id);
      toast.success(response.data.message || 'User deleted.');
      if (editingUserId === member.id) {
        resetUserEditor();
      }
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const headline = isAdmin
    ? 'Coordinate organizers, shape campaigns, and keep the platform healthy from one place.'
    : 'Launch campaigns, keep them current, and move each initiative from draft to delivery.';

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_35%),radial-gradient(circle_at_left,_rgba(14,165,233,0.08),_transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <SparkIcon />
              {isAdmin ? 'Admin command center' : 'Organizer studio'}
            </div>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl leading-tight text-slate-900">
              {isAdmin ? 'Lead the people behind the impact.' : 'Build campaigns with clarity and momentum.'}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-500">{headline}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white px-4 py-2 text-slate-600 border border-slate-200 shadow-sm">
                Signed in as <strong className="text-slate-900">{user?.name}</strong>
              </span>
              <span className={`rounded-full px-4 py-2 border shadow-sm capitalize ${roleToneMap[user?.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={isAdmin ? 'Active organizers' : 'Campaigns in motion'}
              value={isAdmin ? overview?.stats?.users?.organizers ?? '—' : campaigns.filter((campaign) => campaign.status === 'active').length}
              hint={isAdmin ? 'People ready to run community initiatives.' : 'Campaigns currently visible and running.'}
              icon={<TeamIcon />}
              tint="bg-blue-500"
            />
            <MetricCard
              label="Active campaigns"
              value={isAdmin ? overview?.stats?.campaigns?.active_campaigns ?? '—' : campaigns.filter((campaign) => campaign.status === 'active').length}
              hint="Campaigns available for volunteers right now."
              icon={<CampaignIcon />}
              tint="bg-emerald-500"
            />
            <MetricCard
              label={isAdmin ? 'Volunteer accounts' : 'Draft campaigns'}
              value={isAdmin ? overview?.stats?.users?.volunteers ?? '—' : campaigns.filter((campaign) => campaign.status === 'draft').length}
              hint={isAdmin ? 'Community members ready to participate.' : 'Ideas still being prepared before launch.'}
              icon={<UserIcon />}
              tint="bg-amber-500"
            />
            <MetricCard
              label={isAdmin ? 'Total campaigns' : 'Completed campaigns'}
              value={isAdmin ? overview?.stats?.campaigns?.total_campaigns ?? '—' : campaigns.filter((campaign) => campaign.status === 'completed').length}
              hint={isAdmin ? 'Everything your platform is currently hosting.' : 'Campaigns that have already delivered.'}
              icon={<SparkIcon />}
              tint="bg-slate-500"
            />
          </div>
        </section>

        {isAdmin && (
          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <Card className="bg-slate-900 text-white border-slate-900 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#34d399,_transparent_35%),radial-gradient(circle_at_bottom_left,_#38bdf8,_transparent_28%)]" />
              <div className="relative">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Platform pulse</p>
                <h2 className="mt-3 font-display text-3xl">A calmer way to manage growth.</h2>
                <p className="mt-3 max-w-2xl text-slate-300 leading-relaxed">
                  Use this space to create organizers, keep user access under control, and move campaigns from draft to public launch without breaking the volunteer experience.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Recent users</p>
                    <p className="mt-2 text-2xl font-display">{overview?.recentUsers?.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Recent campaigns</p>
                    <p className="mt-2 text-2xl font-display">{overview?.recentCampaigns?.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Active accounts</p>
                    <p className="mt-2 text-2xl font-display">{overview?.stats?.users?.active_users ?? 0}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-display text-2xl text-slate-900">Recent campaign activity</h3>
                <p className="text-sm text-slate-500 mt-1">A quick look at the newest initiatives entering the system.</p>
              </CardHeader>
              <div className="space-y-3">
                {overview?.recentCampaigns?.length ? overview.recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-slate-100 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{campaign.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{campaign.location || 'Location to be confirmed'}</p>
                      </div>
                      <Badge status={campaign.status} />
                    </div>
                  </div>
                )) : <EmptyPanel title="No campaigns yet" description="Once campaigns are created, the newest ones will appear here." />}
              </div>
            </Card>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <SectionTitle
              title={isAdmin ? 'Campaign control room' : 'Your campaign studio'}
              subtitle={editingCampaignId
                ? 'Update an existing campaign, replace its image, or refine its location and timing.'
                : isAdmin
                  ? 'Create initiatives and keep every status aligned with the public experience.'
                  : 'Create and manage the campaigns your volunteers will see.'}
              action={<Button variant="secondary" onClick={loadDashboard}>Refresh</Button>}
            />

            <form onSubmit={handleCreateCampaign} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Campaign title"
                  name="title"
                  value={campaignForm.title}
                  onChange={handleCampaignChange}
                  placeholder="Community food drive"
                  icon={<CampaignIcon />}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="campaign-image" className="text-sm font-semibold text-slate-700">Cover photo</label>
                <div className="mt-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <input
                    id="campaign-image"
                    name="campaign-image"
                    type="file"
                    accept="image/*"
                    onChange={handleCampaignImageChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-700"
                  />
                  <p className="mt-2 text-xs text-slate-400">Upload a JPG, PNG, or WebP image up to 5 MB.</p>
                  {campaignImagePreview && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={campaignImagePreview} alt="Campaign preview" className="h-56 w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={campaignForm.description}
                  onChange={handleCampaignChange}
                  rows={4}
                  placeholder="Describe the campaign goals, audience, and what volunteers will support."
                  className="input-field mt-1.5 resize-none"
                />
              </div>
              <Input
                label="Location"
                name="location"
                value={campaignForm.location}
                onChange={handleCampaignChange}
                placeholder="Casablanca, community center"
              />
              <Input
                label="Latitude"
                name="latitude"
                value={campaignForm.latitude}
                onChange={handleCampaignChange}
                placeholder="33.5731"
              />
              <Input
                label="Longitude"
                name="longitude"
                value={campaignForm.longitude}
                onChange={handleCampaignChange}
                placeholder="-7.5898"
              />
              <div>
                <label htmlFor="status" className="text-sm font-semibold text-slate-700">Initial status</label>
                <select
                  id="status"
                  name="status"
                  value={campaignForm.status}
                  onChange={handleCampaignChange}
                  className="input-field mt-1.5"
                >
                  {campaignStatuses.map((status) => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Pick exact place on the map</label>
                <p className="mt-1 text-xs text-slate-400">Click on the map or drag the marker to save latitude and longitude for this campaign.</p>
                <div className="mt-3">
                  <MapPicker
                    latitude={campaignForm.latitude}
                    longitude={campaignForm.longitude}
                    onPick={handleMapPick}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="start_date" className="text-sm font-semibold text-slate-700">Start date</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={campaignForm.start_date}
                  onChange={handleCampaignChange}
                  className="input-field mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="text-sm font-semibold text-slate-700">End date</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={campaignForm.end_date}
                  onChange={handleCampaignChange}
                  className="input-field mt-1.5"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <div className="flex gap-3">
                  {editingCampaignId && (
                    <Button type="button" variant="secondary" onClick={resetCampaignEditor}>
                      Cancel edit
                    </Button>
                  )}
                  <Button type="submit" loading={submittingCampaign}>
                    {submittingCampaign ? 'Saving campaign...' : editingCampaignId ? 'Update campaign' : 'Create campaign'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {isAdmin && (
            <Card>
              <SectionTitle
                title="Create organizer"
                subtitle="Admins can provision organizer accounts directly instead of exposing organizer signup publicly."
              />
              <form onSubmit={handleCreateOrganizer} className="space-y-4">
                <Input
                  label="Organizer name"
                  name="name"
                  value={organizerForm.name}
                  onChange={handleOrganizerChange}
                  placeholder="Amine El Idrissi"
                  icon={<UserIcon />}
                  required
                />
                <Input
                  label="Work email"
                  name="email"
                  type="email"
                  value={organizerForm.email}
                  onChange={handleOrganizerChange}
                  placeholder="organizer@solidarity.org"
                  icon={<MailIcon />}
                  required
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={organizerForm.phone}
                  onChange={handleOrganizerChange}
                  placeholder="+212 600 000 000"
                  icon={<PhoneIcon />}
                />
                <Input
                  label="Temporary password"
                  name="password"
                  type="password"
                  value={organizerForm.password}
                  onChange={handleOrganizerChange}
                  placeholder="At least 8 characters"
                  icon={<LockIcon />}
                  required
                />
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={organizerForm.confirmPassword}
                  onChange={handleOrganizerChange}
                  placeholder="Repeat the password"
                  icon={<LockIcon />}
                  required
                />
                <Button type="submit" className="w-full" loading={submittingOrganizer}>
                  {submittingOrganizer ? 'Creating organizer...' : 'Create organizer account'}
                </Button>
              </form>
            </Card>
          )}
        </section>

        <section>
          <SectionTitle
            title={isAdmin ? 'Campaign workflow board' : 'Managed campaigns'}
            subtitle={isAdmin ? 'Review and update every campaign status from a single surface.' : 'Keep your campaigns accurate as they move from planning to delivery.'}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.length ? campaigns.map((campaign) => (
              <Card key={campaign.id} className="border border-slate-100">
                {campaign.image_url && (
                  <div className="-mx-6 -mt-6 mb-5 h-44 overflow-hidden rounded-t-2xl bg-slate-100">
                    <img src={getAssetUrl(campaign.image_url)} alt={campaign.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl text-slate-900">{campaign.title}</h3>
                      <Badge status={campaign.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                      {campaign.description || 'No description yet. Add one to give your team clearer direction.'}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-400">Location</p>
                    {getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude) ? (
                      <a
                        href={getGoogleMapsUrl(campaign.location, campaign.latitude, campaign.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block font-semibold text-emerald-700 hover:underline"
                      >
                        {campaign.location || 'Open in Google Maps'}
                      </a>
                    ) : (
                      <p className="font-semibold text-slate-700 mt-1">{campaign.location || 'Pending'}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-400">Organizer</p>
                    <p className="font-semibold text-slate-700 mt-1">{campaign.organizer_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditCampaign(campaign)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={busyCampaignId === campaign.id}
                    onClick={() => handleDeleteCampaign(campaign)}
                  >
                    Delete
                  </Button>
                  {campaignStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busyCampaignId === campaign.id || campaign.status === status}
                      onClick={() => handleCampaignStatusChange(campaign.id, status)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        campaign.status === status
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {busyCampaignId === campaign.id && campaign.status !== status ? 'Updating...' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </Card>
            )) : <EmptyPanel title="No managed campaigns yet" description="Create your first campaign above and it will appear here for status control." />}
          </div>
        </section>

        {isAdmin && (
          <section>
            <SectionTitle
              title="People and roles"
              subtitle="Search the team, change organizer assignments, and pause access when needed."
            />

            <Card>
              {editingUserId && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl text-slate-900">Edit user</h3>
                      <p className="text-sm text-slate-500">Update profile information, role, and account state.</p>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={resetUserEditor}>
                      Cancel
                    </Button>
                  </div>

                  <form onSubmit={handleSaveUser} className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Full name"
                      name="name"
                      value={userForm.name}
                      onChange={handleUserFormChange}
                      placeholder="Full name"
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                      placeholder="email@example.com"
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      value={userForm.phone}
                      onChange={handleUserFormChange}
                      placeholder="+212 ..."
                    />
                    <div>
                      <label htmlFor="user-role" className="text-sm font-semibold text-slate-700">Role</label>
                      <select
                        id="user-role"
                        name="role"
                        value={userForm.role}
                        onChange={handleUserFormChange}
                        className="input-field mt-1.5"
                      >
                        <option value="admin">Admin</option>
                        <option value="organizer">Organizer</option>
                        <option value="volunteer">Volunteer</option>
                      </select>
                    </div>
                    <label className="md:col-span-2 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={userForm.is_active}
                        onChange={handleUserFormChange}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Keep this account active
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" loading={savingUser}>
                        {savingUser ? 'Saving user...' : 'Save user changes'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <Input
                    label="Search users"
                    name="user-search"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search by name, email, or phone"
                    icon={<MailIcon />}
                  />
                </div>
                <div className="w-full lg:w-56">
                  <label htmlFor="user-role-filter" className="text-sm font-semibold text-slate-700">Role filter</label>
                  <select
                    id="user-role-filter"
                    value={userRoleFilter}
                    onChange={(event) => setUserRoleFilter(event.target.value)}
                    className="input-field mt-1.5"
                  >
                    <option value="all">All roles</option>
                    <option value="admin">Admins</option>
                    <option value="organizer">Organizers</option>
                    <option value="volunteer">Volunteers</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="pb-3 pr-4 font-semibold">User</th>
                      <th className="pb-3 pr-4 font-semibold">Role</th>
                      <th className="pb-3 pr-4 font-semibold">Status</th>
                      <th className="pb-3 pr-4 font-semibold">Created</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleUsers.map((member) => (
                      <tr key={member.id}>
                        <td className="py-4 pr-4">
                          <div>
                            <p className="font-semibold text-slate-800">{member.name}</p>
                            <p className="text-slate-500">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleToneMap[member.role] || 'bg-slate-100 text-slate-600'}`}>
                              {member.role}
                            </span>
                            {member.role !== 'admin' && (
                              <select
                                value={member.role}
                                disabled={busyUserId === member.id}
                                onChange={(event) => handleRoleChange(member, event.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                              >
                                {roleOptions.map((role) => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${member.is_active ? statusToneMap.active : statusToneMap.inactive}`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-500">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditUser(member)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant={member.is_active ? 'secondary' : 'primary'}
                              size="sm"
                              loading={busyUserId === member.id}
                              onClick={() => handleToggleUserStatus(member)}
                            >
                              {member.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              loading={busyUserId === member.id}
                              onClick={() => handleDeleteUser(member)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visibleUsers.length && (
                  <div className="pt-6">
                    <EmptyPanel title="No users match these filters" description="Try a different search term or clear the role filter." />
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-card">
            Loading dashboard data...
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
