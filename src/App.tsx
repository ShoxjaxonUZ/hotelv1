import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { BranchesView } from './components/BranchesView';
import { RoomsGrid } from './components/RoomsGrid';
import { RoomDetailTable } from './components/RoomDetailTable';
import { BookingModal } from './components/BookingModal';
import { ReportsModal } from './components/ReportsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NewBranchModal } from './components/NewBranchModal';
import { DeleteBranchModal } from './components/DeleteBranchModal';
import { 
  fetchBranches, 
  createBranch,
  updateBranch,
  deleteBranch,
  fetchBranchRooms, 
  fetchRoomBookings, 
  createBooking, 
  updateBooking, 
  deleteBooking,
  resetToCleanEmptyData,
  resetToSampleData
} from './services/api';
import { User, Branch, Room, Booking, RoomDetailResponse } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type ViewMode = 'branches' | 'rooms' | 'room-table';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hotel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // App Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('branches');
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<number | null>(null);

  // Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchRooms, setCurrentBranchRooms] = useState<Room[]>([]);
  const [roomDetailData, setRoomDetailData] = useState<RoomDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(1);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [reportTypeForModal, setReportTypeForModal] = useState<'daily' | 'monthly'>('daily');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [isDeleteBranchModalOpen, setIsDeleteBranchModalOpen] = useState(false);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // 1. Load Branches
  const loadBranches = useCallback(async () => {
    try {
      const data = await fetchBranches();
      setBranches(data);
    } catch (err: any) {
      console.error('Error fetching branches:', err);
    }
  }, []);

  // 2. Load Rooms for Selected Branch
  const loadBranchRooms = useCallback(async (branchId: number) => {
    setIsLoading(true);
    try {
      const data = await fetchBranchRooms(branchId);
      setCurrentBranchRooms(data.rooms);
    } catch (err: any) {
      showNotification(err.message || 'Xonalarni yuklashda xatolik', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Load Bookings for Selected Room
  const loadRoomBookings = useCallback(async (branchId: number, roomNumber: number) => {
    setIsLoading(true);
    try {
      const data = await fetchRoomBookings(branchId, roomNumber);
      setRoomDetailData(data);
    } catch (err: any) {
      showNotification(err.message || "Xona ma'lumotlarini yuklashda xatolik", 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Load on Auth
  useEffect(() => {
    if (currentUser) {
      loadBranches();
    }
  }, [currentUser, loadBranches]);

  // Handle Route Transitions
  useEffect(() => {
    if (!currentUser) return;

    if (currentView === 'rooms' && selectedBranchId) {
      loadBranchRooms(selectedBranchId);
    } else if (currentView === 'room-table' && selectedBranchId && selectedRoomNumber) {
      loadRoomBookings(selectedBranchId, selectedRoomNumber);
    }
  }, [currentView, selectedBranchId, selectedRoomNumber, currentUser, loadBranchRooms, loadRoomBookings]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBranches();
    if (selectedBranchId && currentView === 'rooms') {
      await loadBranchRooms(selectedBranchId);
    } else if (selectedBranchId && selectedRoomNumber && currentView === 'room-table') {
      await loadRoomBookings(selectedBranchId, selectedRoomNumber);
    }
    setIsRefreshing(false);
    showNotification("Ma'lumotlar yangilandi", 'success');
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('hotel_user', JSON.stringify(user));
    localStorage.setItem('hotel_token', token);
    showNotification(`Xush kelibsiz, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hotel_user');
    localStorage.removeItem('hotel_token');
    setCurrentView('branches');
    setSelectedBranchId(null);
    setSelectedRoomNumber(null);
  };

  // Navigation Handlers
  const handleSelectBranch = (branchId: number | null) => {
    if (branchId === null) {
      setSelectedBranchId(null);
      setSelectedRoomNumber(null);
      setCurrentView('branches');
      loadBranches();
    } else {
      setSelectedBranchId(branchId);
      setSelectedRoomNumber(null);
      setCurrentView('rooms');
    }
  };

  const handleSelectRoom = (roomNumber: number) => {
    setSelectedRoomNumber(roomNumber);
    setCurrentView('room-table');
  };

  // Reports Openers
  const handleOpenDailyReports = () => {
    setReportTypeForModal('daily');
    setIsReportsModalOpen(true);
  };

  const handleOpenMonthlyReports = () => {
    setReportTypeForModal('monthly');
    setIsReportsModalOpen(true);
  };

  // CRUD Handlers
  const handleOpenAddBooking = (presetRoom?: Room) => {
    setEditingBooking(null);
    setSelectedSlotNumber(1);
    if (presetRoom) {
      setSelectedRoomNumber(presetRoom.room_number);
    }
    setIsBookingModalOpen(true);
  };

  const handleOpenAddBookingForSlot = (slotNumber: number) => {
    setEditingBooking(null);
    setSelectedSlotNumber(slotNumber);
    setIsBookingModalOpen(true);
  };

  const handleOpenEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setSelectedSlotNumber(booking.slot_number || 1);
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (payload: Partial<Booking>) => {
    if (editingBooking) {
      await updateBooking(editingBooking.id, payload);
      showNotification("Mijoz ma'lumotlari yangilandi", 'success');
    } else {
      await createBooking(payload);
      showNotification("Yangi mijoz muvaffaqiyatli qo'shildi", 'success');
    }

    // Refresh state
    await loadBranches();
    if (selectedBranchId && selectedRoomNumber && currentView === 'room-table') {
      await loadRoomBookings(selectedBranchId, selectedRoomNumber);
    } else if (selectedBranchId && currentView === 'rooms') {
      await loadBranchRooms(selectedBranchId);
    }
  };

  const handleOpenDelete = (booking: Booking) => {
    setDeletingBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBooking) return;
    setIsDeleting(true);
    try {
      await deleteBooking(deletingBooking.id);
      showNotification("Yozuv o'chirildi", 'success');
      setIsDeleteModalOpen(false);
      setDeletingBooking(null);

      // Refresh
      await loadBranches();
      if (selectedBranchId && selectedRoomNumber && currentView === 'room-table') {
        await loadRoomBookings(selectedBranchId, selectedRoomNumber);
      }
    } catch (err: any) {
      showNotification(err.message || "O'chirishda xatolik", 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (booking: Booking, status: 'active' | 'completed' | 'cancelled') => {
    try {
      await updateBooking(booking.id, { status });
      showNotification(
        status === 'completed' 
          ? "Xona bo'shatildi, buyurtma yakunlandi" 
          : "Buyurtma holati o'zgartirildi",
        'success'
      );
      if (selectedBranchId && selectedRoomNumber && currentView === 'room-table') {
        await loadRoomBookings(selectedBranchId, selectedRoomNumber);
      }
      await loadBranches();
    } catch (err: any) {
      showNotification(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setIsNewBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setIsNewBranchModalOpen(true);
  };

  const handleOpenDeleteBranch = (branch: Branch) => {
    setDeletingBranch(branch);
    setIsDeleteBranchModalOpen(true);
  };

  const handleConfirmDeleteBranch = async () => {
    if (!deletingBranch) return;
    setIsDeletingBranch(true);
    try {
      await deleteBranch(deletingBranch.id);
      showNotification(`"${deletingBranch.name}" muvaffaqiyatli o'chirildi`, 'success');
      setIsDeleteBranchModalOpen(false);
      setDeletingBranch(null);
      if (selectedBranchId === deletingBranch.id) {
        setSelectedBranchId(null);
        setCurrentView('branches');
      }
      await loadBranches();
    } catch (err: any) {
      showNotification(err.message || "Filialni o'chirishda xatolik", 'error');
    } finally {
      setIsDeletingBranch(false);
    }
  };

  const handleSaveBranch = async (data: { name: string; address: string; phone: string; rooms_count: number }) => {
    if (editingBranch) {
      await updateBranch(editingBranch.id, {
        name: data.name,
        address: data.address,
        phone: data.phone
      });
      showNotification(`"${data.name}" ma'lumotlari muvaffaqiyatli yangilandi!`, 'success');
    } else {
      await createBranch(data);
      showNotification(`"${data.name}" muvaffaqiyatli yaratildi!`, 'success');
    }
    await loadBranches();
  };

  const handleResetCleanData = async () => {
    resetToCleanEmptyData();
    showNotification("Barcha xonalar bo'shatildi: toza (0 dan) holatga o'tkazildi", 'success');
    await loadBranches();
    if (selectedBranchId) {
      await loadBranchRooms(selectedBranchId);
    }
  };

  const handleResetSampleData = async () => {
    resetToSampleData();
    showNotification("Namunaviy mehmonlar va to'lovlar qayta yuklandi", 'success');
    await loadBranches();
    if (selectedBranchId) {
      await loadBranchRooms(selectedBranchId);
    }
  };

  // If not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={handleSelectBranch}
        onOpenDailyReports={handleOpenDailyReports}
        onOpenMonthlyReports={handleOpenMonthlyReports}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-slideDown">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: Branches Overview */}
        {currentView === 'branches' && (
          <BranchesView
            branches={branches}
            onSelectBranch={handleSelectBranch}
            onOpenDailyReports={handleOpenDailyReports}
            onOpenMonthlyReports={handleOpenMonthlyReports}
            onOpenNewBranchModal={handleOpenAddBranch}
            onEditBranch={handleOpenEditBranch}
            onDeleteBranch={handleOpenDeleteBranch}
          />
        )}

        {/* VIEW 2: Rooms Grid for Selected Branch */}
        {currentView === 'rooms' && currentBranch && (
          <RoomsGrid
            branch={currentBranch}
            rooms={currentBranchRooms}
            onBack={() => handleSelectBranch(null)}
            onSelectRoom={handleSelectRoom}
            onQuickBook={(room) => handleOpenAddBooking(room)}
            onOpenDailyReports={handleOpenDailyReports}
            onOpenMonthlyReports={handleOpenMonthlyReports}
          />
        )}

        {/* VIEW 3: Room Detail Bookings Table (10 Permanent Rows) */}
        {currentView === 'room-table' && roomDetailData && (
          <RoomDetailTable
            branch={roomDetailData.branch}
            room={roomDetailData.room}
            bookings={roomDetailData.bookings}
            totals={roomDetailData.totals}
            onBack={() => setCurrentView('rooms')}
            onAddBooking={() => handleOpenAddBooking()}
            onAddBookingForSlot={handleOpenAddBookingForSlot}
            onEditBooking={handleOpenEditBooking}
            onDeleteBooking={handleOpenDelete}
            onUpdateStatus={handleUpdateStatus}
            onOpenDailyReports={handleOpenDailyReports}
            onOpenMonthlyReports={handleOpenMonthlyReports}
          />
        )}
      </main>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSave={handleSaveBooking}
        initialBooking={editingBooking}
        initialSlotNumber={selectedSlotNumber || 1}
        currentBranchId={selectedBranchId || 1}
        currentRoomNumber={selectedRoomNumber || 1}
        branches={branches}
        rooms={currentBranchRooms.length > 0 ? currentBranchRooms : []}
      />

      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        defaultBranchId={selectedBranchId ? String(selectedBranchId) : 'all'}
        branches={branches}
        initialReportType={reportTypeForModal}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        booking={deletingBooking}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingBooking(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <NewBranchModal
        isOpen={isNewBranchModalOpen}
        onClose={() => {
          setIsNewBranchModalOpen(false);
          setEditingBranch(null);
        }}
        onSave={handleSaveBranch}
        existingBranchesCount={branches.length}
        editingBranch={editingBranch}
      />

      <DeleteBranchModal
        isOpen={isDeleteBranchModalOpen}
        branch={deletingBranch}
        onClose={() => {
          setIsDeleteBranchModalOpen(false);
          setDeletingBranch(null);
        }}
        onConfirm={handleConfirmDeleteBranch}
        isDeleting={isDeletingBranch}
      />
    </div>
  );
}
