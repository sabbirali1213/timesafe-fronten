import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { Separator } from './components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Label } from './components/ui/label';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { 
  ShoppingCart, 
  User, 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  Star,
  Plus,
  Minus,
  Home,
  Settings,
  History,
  CreditCard,
  Phone,
  Mail,
  Store,
  Navigation,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Map,
  Headphones,
  Info,
  UserPlus,
  Filter,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';
import ChatBot from './components/ChatBot'; // 🤖 Import ChatBot
import GoogleMapsComponent from './components/GoogleMapsComponent'; // Google Maps Component
import FirebaseAuth from './components/FirebaseAuth'; // Firebase Authentication

// Firebase imports for FCM notifications
import { 
  requestNotificationPermission, 
  onMessageListener, 
  showNotification,
  isFirebaseMessagingSupported 
} from './lib/firebase';

// Fix Leaflet default markers
import * as L from 'leaflet';
if (L && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Backend URL configuration with fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 
                   process.env.BACKEND_URL || 
                   window.location.origin;
const API = `${BACKEND_URL}/api`;

// Production config logging
console.log('🔧 TimeSafe Delivery Config:', {
  BACKEND_URL,
  API,
  NODE_ENV: process.env.NODE_ENV
});

// Notification Sound Service
class NotificationSoundService {
  constructor() {
    this.soundsEnabled = localStorage.getItem('notificationSounds') !== 'false';
    this.audioContext = null;
    this.sounds = {};
    this.isInitialized = false;
    this.ringingInterval = null; // For continuous ringing
    this.activeOscillators = [];
    this.initializeAudio();
  }

  initializeAudio() {
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = true;
      } catch (error) {
        console.log('Audio context creation failed:', error);
      }
    }
  }

  async initializeOnUserInteraction() {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      try {
        if (this.audioContext) {
          await this.audioContext.resume();
        } else {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.isInitialized = true;
        console.log('Audio context initialized successfully');
      } catch (error) {
        console.log('Failed to initialize audio context:', error);
      }
    }
  }

  // Stop all sounds including continuous ringing
  stopAllSounds() {
    // Stop continuous ringing
    if (this.ringingInterval) {
      clearInterval(this.ringingInterval);
      this.ringingInterval = null;
    }

    // Stop any active oscillators
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (error) {
        // Already stopped
      }
    });
    this.activeOscillators = [];
    console.log('All sounds stopped');
  }

  // Generate phone-like ringtone
  async generatePhoneRing() {
    if (!this.soundsEnabled) return;

    if (!this.isInitialized || !this.audioContext || this.audioContext.state === 'suspended') {
      await this.initializeOnUserInteraction();
    }

    if (!this.audioContext) return;

    try {
      // Create a phone-like ring pattern with two frequencies
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      this.activeOscillators.push(oscillator1, oscillator2);
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Phone ring frequencies (typical ringtone)
      oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime); // High tone
      oscillator2.frequency.setValueAtTime(900, this.audioContext.currentTime); // Higher tone
      
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      // Ring pattern: loud for 1 second, quiet for 0.3 seconds
      gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 1.0);
      gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 1.3);
      
      const ringDuration = 1.3; // One ring cycle
      
      oscillator1.start(this.audioContext.currentTime);
      oscillator2.start(this.audioContext.currentTime);
      
      oscillator1.stop(this.audioContext.currentTime + ringDuration);
      oscillator2.stop(this.audioContext.currentTime + ringDuration);
      
      // Clean up when finished
      setTimeout(() => {
        const index1 = this.activeOscillators.indexOf(oscillator1);
        const index2 = this.activeOscillators.indexOf(oscillator2);
        if (index1 > -1) this.activeOscillators.splice(index1, 1);
        if (index2 > -1) this.activeOscillators.splice(index2, 1);
      }, ringDuration * 1000);
      
    } catch (error) {
      console.log('Error playing phone ring:', error);
    }
  }

  // Start continuous ringing like phone call
  async startContinuousRinging() {
    if (!this.soundsEnabled) return;
    
    console.log('Starting continuous phone-like ringing...');
    
    // Stop any existing ringing first
    this.stopAllSounds();
    
    // Initialize audio context
    await this.initializeOnUserInteraction();
    
    // Play initial ring
    await this.generatePhoneRing();
    
    // Set up continuous ringing every 2 seconds
    this.ringingInterval = setInterval(() => {
      if (this.soundsEnabled) {
        this.generatePhoneRing();
      }
    }, 2000); // Ring every 2 seconds like a phone call
  }

  // Stop continuous ringing
  stopContinuousRinging() {
    console.log('Stopping continuous ringing');
    this.stopAllSounds();
  }

  // New order sound - continuous ringing until stopped
  async playNewOrderSound() {
    if (!this.soundsEnabled) return;
    console.log('New order - starting continuous ringing');
    await this.startContinuousRinging();
  }

  // Order ready sound - single alert
  async playOrderReadySound() {
    if (!this.soundsEnabled) return;
    console.log('Playing order ready sound');
    await this.generatePhoneRing();
  }

  // Order update sound - single alert  
  async playOrderUpdateSound() {
    if (!this.soundsEnabled) return;
    console.log('Playing order update sound');
    await this.generatePhoneRing();
  }

  // Test sound function
  async testSound() {
    console.log('Testing phone ring sound...');
    await this.initializeOnUserInteraction();
    await this.generatePhoneRing();
  }

  toggleSounds() {
    if (this.soundsEnabled) {
      this.stopAllSounds();
    }
    
    this.soundsEnabled = !this.soundsEnabled;
    localStorage.setItem('notificationSounds', this.soundsEnabled.toString());
    console.log('Notification sounds:', this.soundsEnabled ? 'enabled' : 'disabled');
    return this.soundsEnabled;
  }

  isSoundEnabled() {
    return this.soundsEnabled;
  }
}

// Global notification service instance
const notificationService = new NotificationSoundService();

// Helper function to calculate exact real-time timing
// eslint-disable-next-line no-unused-vars
const getTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown time';
  
  const now = new Date();
  const orderDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - orderDate.getTime()) / 1000);
  
  if (diffInSeconds < 0) return 'Just now';
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    if (seconds === 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    return `${minutes}m ${seconds}s ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    if (minutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    return `${hours}h ${minutes}m ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    if (hours === 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    return `${days}d ${hours}h ago`;
  }
};

// Helper function to get exact current timestamp
// eslint-disable-next-line no-unused-vars
const getExactTimestamp = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const orderDate = new Date(dateString);
  const now = new Date();
  const today = now.toDateString();
  const orderDay = orderDate.toDateString();
  
  const timeString = orderDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (orderDay === today) {
    return `Today ${timeString}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (orderDay === yesterday.toDateString()) {
    return `Yesterday ${timeString}`;
  }
  
  // For older dates, show date with time
  return `${orderDate.toLocaleDateString()} ${timeString}`;
};

// Helper function to get order urgency color based on time
// eslint-disable-next-line no-unused-vars
const getOrderUrgencyColor = (dateString, status) => {
  if (!dateString || status === 'delivered' || status === 'rejected') return 'text-gray-500';
  
  const diffInMinutes = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60));
  
  if (status === 'placed') {
    if (diffInMinutes < 5) return 'text-green-600'; // Very fresh
    if (diffInMinutes < 15) return 'text-yellow-600'; // Getting urgent
    return 'text-red-600'; // Very urgent
  } else if (status === 'accepted' || status === 'prepared') {
    if (diffInMinutes < 30) return 'text-blue-600'; // On track
    if (diffInMinutes < 60) return 'text-yellow-600'; // Delayed
    return 'text-red-600'; // Very delayed
  } else {
    return 'text-purple-600'; // In transit
  }
};

// Real-Time Date Time Display Component - Order Pages Format
const OrderDateTime = ({ showSeconds = true }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, showSeconds ? 1000 : 60000); // Update every second if showing seconds, else every minute
    
    return () => clearInterval(interval);
  }, [showSeconds]);
  
  const formatDateTime = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = showSeconds 
      ? `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`
      : `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    return `${dateStr} ${timeStr}`;
  };
  
  return (
    <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
      <span className="text-sm font-medium text-blue-800">📅 Current:</span>
      <span className="font-mono font-bold text-blue-900 text-sm">
        {formatDateTime(currentDateTime)}
      </span>
    </div>
  );
};

const CustomerCareWidget = ({ position = "header" }) => {
  const supportNumber = "7506228860";
  
  const callSupport = () => {
    window.open(`tel:+91${supportNumber}`, '_self');
  };

  if (position === "floating") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={callSupport}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg animate-pulse"
          title="24/7 Customer Care"
        >
          <Headphones className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-500 p-2 rounded-full">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-red-700 flex items-center space-x-2">
              <span>🔴</span>
              <span>24/7 Customer Care</span>
            </h4>
            <p className="text-sm text-red-600">Need help? Call us anytime!</p>
          </div>
        </div>
        <Button
          onClick={callSupport}
          variant="outline"
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white border-red-500 flex items-center space-x-2"
        >
          <Phone className="h-4 w-4" />
          <span className="font-mono font-bold">+91 {supportNumber}</span>
        </Button>
      </div>
      <div className="mt-2 text-xs text-red-500 flex items-center space-x-4">
        <span>🕒 24 Hours Available</span>
        <span>📞 Instant Support</span>
        <span>🛡️ Technical Help</span>
      </div>
    </div>
  );
};

// Customer Care Info Component for Dashboards
const CustomerCareInfo = () => {
  const supportNumber = "7506228860";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <Headphones className="h-5 w-5" />
          <span>Customer Care</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="bg-red-500 text-white p-4 rounded-lg mb-3">
            <h3 className="font-bold text-lg">24/7 Support Available</h3>
            <p className="text-red-100 text-sm">Call us anytime for help!</p>
          </div>
          
          <Button
            onClick={() => window.open(`tel:+91${supportNumber}`, '_self')}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-3"
          >
            <Phone className="h-5 w-5 mr-2" />
            📞 Call +91 {supportNumber}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="text-center p-2 bg-blue-50 rounded">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">24 Hours</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <Headphones className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-green-600 font-medium">Instant Help</p>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-600 mt-3">
          <p>• Order Issues • Payment Help</p>  
          <p>• Technical Support • General Queries</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Product Details Modal Component
const ProductDetailsModal = ({ product, isOpen, onClose, addToCart, buyNow }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedWeight, setSelectedWeight] = useState('500g');
  const [quantity, setQuantity] = useState(1);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://timesafe.in';
  
  if (!product) return null;

  // Calculate weight in kg for pricing
  const getWeightInKg = (weight) => {
    return weight === '1kg' ? 1 : weight === '500g' ? 0.5 : 0.25;
  };

  // Calculate total price
  const getTotalPrice = () => {
    return Math.round(product.price_per_kg * getWeightInKg(selectedWeight) * quantity);
  };

  // Handle quantity increase/decrease
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);
  
  // Get all available images
  const getAllImages = () => {
    const images = [];
    
    // Add main image if exists
    if (product.image_url && product.image_url.trim() !== '') {
      images.push(product.image_url);
    }
    
    // Add additional images from image_urls array
    if (product.image_urls && Array.isArray(product.image_urls)) {
      product.image_urls.forEach(url => {
        if (url && url.trim() !== '' && !images.includes(url)) {
          images.push(url);
        }
      });
    }
    
    return images;
  };
  
  const images = getAllImages();
  
  // Format image URL helper function
  const formatImageUrl = (imageUrl) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/api/uploads/')) {
      return `${BACKEND_URL}${imageUrl}`;
    } else if (imageUrl.startsWith('/uploads/')) {
      return `${BACKEND_URL}/api${imageUrl}`;
    } else if (imageUrl.startsWith('data:')) {
      return imageUrl;
    } else {
      return `${BACKEND_URL}/api/uploads/${imageUrl}`;
    }
  };
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Large Image Slideshow */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <>
                {/* Main Image Display */}
                <div className="relative aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden">
                  <img 
                    src={formatImageUrl(images[currentImageIndex])}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Product details: Image failed to load:', e.target.src);
                    }}
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                  
                  {/* Total Images Badge */}
                  <Badge className="absolute top-2 left-2 bg-blue-500 text-white">
                    📷 {images.length} Photos
                  </Badge>
                </div>
                
                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex 
                            ? 'border-blue-500 scale-105' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={formatImageUrl(image)}
                          alt={`${product.name} - Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                <span class="text-2xl">🥩</span>
                              </div>
                            `;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-16 w-16 text-orange-400 mx-auto mb-2" />
                  <p className="text-gray-500">No images available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Product Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Product Details</h3>
              <p className="text-gray-600">{product.description || 'No description available'}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price per kg</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{product.price_per_kg}
                </span>
              </div>
              
              {/* Discount badge if applicable */}
              <div className="mt-2">
                <Badge className="bg-red-500 text-white">20% OFF</Badge>
                <span className="text-sm text-gray-500 ml-2">
                  ₹{Math.round(product.price_per_kg * 1.25)} 
                </span>
              </div>
            </div>
            
            {/* Weight Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">📏 Select Weight:</h4>
              
              <div className="grid grid-cols-3 gap-2">
                {['250g', '500g', '1kg'].map((weight) => (
                  <Button
                    key={weight}
                    variant={selectedWeight === weight ? "default" : "outline"}
                    className={`${
                      selectedWeight === weight 
                        ? 'bg-green-600 text-white' 
                        : 'border-green-300 hover:bg-green-50'
                    } transition-all`}
                    onClick={() => setSelectedWeight(weight)}
                  >
                    {weight}<br/>
                    <span className="text-sm">₹{Math.round(product.price_per_kg * getWeightInKg(weight))}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">🔢 Quantity:</h4>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{quantity}</div>
                  <div className="text-xs text-gray-500">packets</div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increaseQuantity}
                  className="w-10 h-10 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total for {quantity} × {selectedWeight}</p>
                  <p className="text-xs text-gray-500">({(getWeightInKg(selectedWeight) * quantity).toFixed(1)} kg total)</p>
                </div>
                <span className="text-3xl font-bold text-green-600">
                  ₹{getTotalPrice()}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-3"
                onClick={() => {
                  for (let i = 0; i < quantity; i++) {
                    addToCart(product, selectedWeight, getWeightInKg(selectedWeight));
                  }
                  onClose();
                  alert(`🛒 Added ${quantity} × ${selectedWeight} to cart!`);
                }}
              >
                🛒 Add to Cart - ₹{getTotalPrice()}
              </Button>

              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-3"
                onClick={() => {
                  buyNow(product, selectedWeight, getWeightInKg(selectedWeight) * quantity);
                  onClose();
                }}
              >
                ⚡ Buy Now - ₹{getTotalPrice()}
              </Button>
            </div>
            
            {/* Product highlights */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">✨ Why Choose Our Mutton?</h4>
              <div className="space-y-1 text-sm text-yellow-700">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Fresh mutton daily
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Free home delivery above ₹500
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Quality guaranteed
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  30-minute delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Product Image Slideshow Component
const ProductImageSlideshow = ({ product }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://timesafe.in';
  
  // Get all available images (both image_url and image_urls)
  const getAllImages = () => {
    const images = [];
    
    // Add main image if exists
    if (product.image_url && product.image_url.trim() !== '') {
      images.push(product.image_url);
    }
    
    // Add additional images from image_urls array
    if (product.image_urls && Array.isArray(product.image_urls)) {
      product.image_urls.forEach(url => {
        if (url && url.trim() !== '' && !images.includes(url)) {
          images.push(url);
        }
      });
    }
    
    return images;
  };
  
  const images = getAllImages();
  
  // If no images, return default placeholder
  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden rounded-t-lg">
        <div className="absolute inset-2 flex items-center justify-center">
          <Package className="h-8 w-8 text-orange-400" />
        </div>
      </div>
    );
  }
  
  // Format image URL helper function
  const formatImageUrl = (imageUrl) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/api/uploads/')) {
      return `${BACKEND_URL}${imageUrl}`;
    } else if (imageUrl.startsWith('/uploads/')) {
      return `${BACKEND_URL}/api${imageUrl}`;
    } else if (imageUrl.startsWith('data:')) {
      return imageUrl;
    } else {
      return `${BACKEND_URL}/api/uploads/${imageUrl}`;
    }
  };
  
  // If only one image, return simple image display - SMALL but BEAUTIFUL
  if (images.length === 1) {
    return (
      <div className="relative h-24 w-full bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden rounded-t-xl cursor-pointer" onClick={() => setSelectedProduct(product)}>
        <img 
          src={formatImageUrl(images[0])}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            console.log('Product slideshow: Image failed to load:', e.target.src);
          }}
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-semibold">
          1/1
        </div>
        <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          📷 HD
        </Badge>
      </div>
    );
  }
  
  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };
  
  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const goToSlide = (index, e) => {
    e.stopPropagation();
    setCurrentSlide(index);
  };
  
  return (
    <div className="relative h-24 w-full bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden rounded-t-lg group cursor-pointer" onClick={() => setSelectedProduct(product)}>
      {/* Main Image Display */}
      <img 
        src={formatImageUrl(images[currentSlide])}
        alt={`${product.name} - Image ${currentSlide + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          console.log('Product slideshow: Image failed to load:', e.target.src);
        }}
      />
      
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ zIndex: 10 }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ zIndex: 10 }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      
      {/* Image Counter */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-xs">
        {currentSlide + 1}/{images.length}
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-2 left-2 flex space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => goToSlide(index, e)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>
      
      {/* Image Badge */}
      <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5">
        📷 {images.length}
      </Badge>
    </div>
  );
};

// Hero Slideshow Component
const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      title: "⏰ TimeSafe Delivery",
      subtitle: "Fresh Mutton in 30 Minutes",
      description: "Premium quality meat delivered to your doorstep with lightning speed",
      bgColor: "from-red-500 to-orange-500",
      image: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1",
      cta: "Order Now"
    },
    {
      id: 2,
      title: "🏪 Premium Vendors",
      subtitle: "Trusted Local Butchers",
      description: "Sourced from certified vendors with 100% quality guarantee",
      bgColor: "from-green-500 to-blue-500", 
      image: "https://images.unsplash.com/photo-1642690743987-e3e613fd6405",
      cta: "Find Vendors"
    },
    {
      id: 3,
      title: "🚚 Fast Delivery",
      subtitle: "Track Your Order Live",
      description: "Real-time tracking with professional delivery partners",
      bgColor: "from-purple-500 to-pink-500",
      image: "https://images.pexels.com/photos/1542252/pexels-photo-1542252.jpeg",
      cta: "Track Order"
    },
    {
      id: 4,
      title: "📞 24/7 Support",
      subtitle: "Always Here to Help",
      description: "Round-the-clock customer care for all your needs",
      bgColor: "from-blue-500 to-indigo-500",
      image: "https://images.unsplash.com/photo-1709715357479-591f9971fb05",
      cta: "Get Help"
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg mb-6">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`w-full h-full bg-gradient-to-r ${slide.bgColor} flex items-center`}>
              {/* Content */}
              <div className="flex-1 text-white p-8">
                <div className="max-w-md">
                  <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
                  <h2 className="text-xl font-semibold mb-3 text-white/90">{slide.subtitle}</h2>
                  <p className="text-white/80 mb-6 leading-relaxed">{slide.description}</p>
                  <Button className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-6 py-2">
                    {slide.cta}
                  </Button>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-64 h-48 overflow-hidden rounded-lg shadow-lg">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="text-8xl opacity-80 hidden flex items-center justify-center h-full">
                    {slide.id === 1 ? '🥩' : slide.id === 2 ? '🏪' : slide.id === 3 ? '🚚' : '📞'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
      >
        <ChevronDown className="h-5 w-5 rotate-90" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
      >
        <ChevronDown className="h-5 w-5 -rotate-90" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-black/30 text-white px-3 py-1 rounded-full text-sm">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

// Free Map Components
const DeliveryMap = ({ center = [12.9716, 77.5946], zoom = 13, markers = [], onLocationSelect, height = 400 }) => {
  const LocationSelector = () => {
    useMapEvents({
      click: (e) => {
        if (onLocationSelect) {
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        }
      }
    });
    return null;
  };

  return (
    <div className="relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: `${height}px`, width: '100%' }}
        className="rounded-lg border"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {onLocationSelect && <LocationSelector />}
        {markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="text-center">
                <strong>{marker.title || 'Location'}</strong>
                {marker.description && <p className="text-sm mt-1">{marker.description}</p>}
                {marker.address && <p className="text-xs text-gray-600 mt-1">{marker.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {onLocationSelect && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-md text-xs">
          📍 Click on map to select location
        </div>
      )}
    </div>
  );
};

// Vendor Location Map
const VendorLocationMap = ({ vendors = [], customerLocation = null }) => {
  const markers = [
    ...vendors.map(vendor => ({
      lat: vendor.latitude || 12.9716 + (Math.random() - 0.5) * 0.1,
      lng: vendor.longitude || 77.5946 + (Math.random() - 0.5) * 0.1,
      title: vendor.name,
      description: `${vendor.business_name || 'Mutton Vendor'}`,
      address: vendor.address || 'Location not specified'
    })),
    ...(customerLocation ? [{
      lat: customerLocation.lat,
      lng: customerLocation.lng,
      title: 'Your Location',
      description: 'Delivery Address'
    }] : [])
  ];

  const center = customerLocation ? [customerLocation.lat, customerLocation.lng] : [12.9716, 77.5946];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Map className="h-5 w-5 text-green-600" />
          <span>Nearby Vendors</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DeliveryMap 
          center={center}
          zoom={12}
          markers={markers}
          height={350}
        />
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>🏪 {vendors.length} vendors nearby</span>
          <span>📍 Free OpenStreetMap</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Address Selection Component with Map
const AddressMapSelector = ({ onAddressSelect, selectedLocation }) => {
  const [mapLocation, setMapLocation] = useState(selectedLocation || null);
  const [address, setAddress] = useState('');

  const handleLocationSelect = (location) => {
    setMapLocation(location);
    // Simple reverse geocoding alternative (you can enhance this)
    const addressText = `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`;
    setAddress(addressText);
    
    if (onAddressSelect) {
      onAddressSelect({
        ...location,
        address: addressText
      });
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationSelect(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your current location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const markers = mapLocation ? [{
    lat: mapLocation.lat,
    lng: mapLocation.lng,
    title: 'Selected Location',
    description: 'Delivery Address'
  }] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Select Delivery Location</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={useCurrentLocation}
          className="flex items-center space-x-1"
        >
          <Navigation className="h-4 w-4" />
          <span>Use Current Location</span>
        </Button>
      </div>
      
      <DeliveryMap
        center={mapLocation ? [mapLocation.lat, mapLocation.lng] : [12.9716, 77.5946]}
        zoom={mapLocation ? 15 : 13}
        markers={markers}
        onLocationSelect={handleLocationSelect}
        height={300}
      />
      
      {mapLocation && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Selected Location:</strong><br />
            {address}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Coordinates: {mapLocation.lat.toFixed(6)}, {mapLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

// Checkout Address Selector Component with Google Maps Integration
const CheckoutAddressSelector = ({ onAddressSelect, selectedAddress }) => {
  const [mapLocation, setMapLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geocodedData, setGeocodedData] = useState(null);

  const handleLocationSelect = async (location) => {
    setMapLocation(location);
    setLoading(true);
    
    try {
      // Use the backend geocoding endpoint
      const response = await axios.post(`${API}/customer/geocode-address?latitude=${location.lat}&longitude=${location.lng}`);
      
      if (response.data.success) {
        const addressData = {
          formatted_address: response.data.formatted_address,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          city: response.data.city,
          state: response.data.state,
          postal_code: response.data.postal_code,
          country: response.data.country
        };
        
        setAddress(response.data.formatted_address);
        setGeocodedData(addressData);
        
        if (onAddressSelect) {
          onAddressSelect(addressData);
        }
      } else {
        const fallbackAddress = `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        setAddress(fallbackAddress);
        if (onAddressSelect) {
          onAddressSelect({
            formatted_address: fallbackAddress,
            latitude: location.lat,
            longitude: location.lng,
            city: '',
            state: '',
            postal_code: '',
            country: 'India'
          });
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      const fallbackAddress = `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      setAddress(fallbackAddress);
      if (onAddressSelect) {
        onAddressSelect({
          formatted_address: fallbackAddress,
          latitude: location.lat,
          longitude: location.lng,
          city: '',
          state: '',
          postal_code: '',
          country: 'India'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationSelect(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location. Please select manually on the map.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={() => setShowMap(!showMap)}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {showMap ? 'Hide Map' : 'Select on Map'}
        </Button>
        <Button
          variant="outline"
          onClick={useCurrentLocation}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </>
          )}
        </Button>
      </div>

      {showMap && (
        <div className="border rounded-lg overflow-hidden">
          <div style={{ height: '300px', width: '100%' }}>
            {typeof window !== 'undefined' && window.google ? (
              <GoogleMapsComponent
                center={{ lat: 28.6139, lng: 77.2090 }}
                zoom={12}
                height="300px"
                width="100%"
                onMapClick={handleLocationSelect}
                markers={mapLocation ? [{
                  lat: mapLocation.lat,
                  lng: mapLocation.lng,
                  title: 'Selected Delivery Location',
                  type: 'delivery'
                }] : []}
                showUserLocation={true}
                mapType="delivery"
              />
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f5f5f5'
              }}>
                <p className="text-gray-600">Loading Google Maps...</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {address && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>🎯 Selected Delivery Address:</strong>
          </p>
          <p className="text-sm text-blue-700 mt-1">
            {address}
          </p>
          {geocodedData && geocodedData.city && (
            <p className="text-xs text-blue-600 mt-1">
              📍 {geocodedData.city}, {geocodedData.state} {geocodedData.postal_code}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Auth Context
const AuthContext = createContext();

// OTP Authentication Components - Clean Direct Login
const OTPAuthPage = () => {
  const [loginMode, setLoginMode] = useState('otp'); // 'otp', 'vendor', or 'admin'
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: User Details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOTPCode] = useState('');
  const [userName, setUserName] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [userType, setUserType] = useState('customer');
  const [userAge, setUserAge] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userCity, setUserCity] = useState('');
  const [userState, setUserState] = useState('');
  const [userPincode, setUserPincode] = useState('');
  // Location states for delivery partners
  const [userLatitude, setUserLatitude] = useState('');
  const [userLongitude, setUserLongitude] = useState('');
  const [serviceRadius, setServiceRadius] = useState('5');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [demoOTP, setDemoOTP] = useState('');
  
  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Vendor login states  
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  
  // Delivery partner login states
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryPassword, setDeliveryPassword] = useState('');
  
  // Registration states
  const [showVendorRegistration, setShowVendorRegistration] = useState(false);
  const [showDeliveryRegistration, setShowDeliveryRegistration] = useState(false);
  
  // Return Policy states
  const [showReturnPolicy, setShowReturnPolicy] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState(null);
  
  // Vendor registration states
  const [vendorRegData, setVendorRegData] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    businessName: '',
    businessType: '',
    latitude: null,
    longitude: null
  });
  
  // Vendor location states for Google Maps
  const [vendorShowMapSelector, setVendorShowMapSelector] = useState(false);
  const [vendorSelectedLocation, setVendorSelectedLocation] = useState(null);
  
  // Delivery registration states  
  const [deliveryRegData, setDeliveryRegData] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    vehicleType: '',
    licenseNumber: ''
  });

  const { login } = useAuth();

  // Fetch Return Policy
  const fetchReturnPolicy = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/policy/return`);
      setReturnPolicy(response.data.return_policy);
    } catch (error) {
      console.error('Failed to fetch return policy:', error);
    }
  }, []);

  // Load return policy on component mount
  useEffect(() => {
    fetchReturnPolicy();
  }, [fetchReturnPolicy]);

  const formatPhoneNumber = (phone) => {
    return '+91' + phone.replace(/\D/g, '');
  };

  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLatitude(position.coords.latitude.toFixed(6));
        setUserLongitude(position.coords.longitude.toFixed(6));
        setDetectingLocation(false);
        alert('✅ Location detected successfully!');
      },
      (error) => {
        setError('Unable to get location: ' + error.message);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const sendOTP = async () => {
    console.log('📱 Sending OTP to:', phoneNumber);
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log('📱 Formatted phone number:', fullPhoneNumber);
      
      // First check if user already exists
      const checkResponse = await axios.post(`${API}/auth/check-phone`, {
        phone_number: fullPhoneNumber
      });
      
      if (checkResponse.data && checkResponse.data.exists) {
        // User exists - set as existing user and send OTP for login
        console.log('👤 Existing user found:', checkResponse.data.name);
        setIsExistingUser(true);
        setUserName(checkResponse.data.name || 'User');
        setUserType(checkResponse.data.user_type || 'customer');
      } else {
        // New user - will need registration form
        setIsExistingUser(false);
      }
      
      // Send OTP using Twilio directly
      const response = await axios.post(`${API}/auth/twilio-send-otp`, {
        phone_number: fullPhoneNumber
      });
      
      if (response.data) {
        console.log('✅ OTP sent successfully', response.data);
        setStep(2); // Move to OTP verification step
      } else {
        throw new Error('Failed to send OTP');
      }
      
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      
      // Handle duplicate registration error gracefully
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already registered')) {
        // For existing users who got the "already registered" error, still proceed to OTP step
        console.log('👤 User already registered, proceeding to login');
        setIsExistingUser(true);
        setStep(2);
        setError('Welcome back! Please enter the OTP to login.');
      } else {
        setError(error.response?.data?.detail || error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    console.log('🔐 Verifying OTP:', otpCode);
    
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    if (!isExistingUser && !userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP using Twilio directly
      const response = await axios.post(`${API}/auth/twilio-verify-otp`, {
        phone_number: formatPhoneNumber(phoneNumber),
        otp_code: otpCode,
        name: userName || 'Customer',
        user_type: 'customer',
        age: userAge ? parseInt(userAge) : null,
        gender: userGender || null,
        address: userAddress || null,
        city: userCity || null,
        state: userState || null,
        pincode: userPincode || null
      });

      console.log('✅ OTP verified successfully', response.data);
      
      // Login user using existing auth system
      login(response.data.user, response.data.access_token, response.data.session_info);
      
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      setError(error.response?.data?.detail || error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Admin login function
  const loginAdmin = async () => {
    if (!adminEmail || !adminPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: adminEmail,
        password: adminPassword
      });

      // Check if user is admin
      if (response.data.user.user_type !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }

      console.log('✅ Admin login successful:', response.data);
      login(response.data.user, response.data.access_token, response.data.session_info);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  // Vendor login function
  const loginVendor = async () => {
    if (!vendorEmail || !vendorPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: vendorEmail,
        password: vendorPassword
      });

      // Check if user is vendor
      if (response.data.user.user_type !== 'vendor') {
        setError('Access denied. Vendor credentials required.');
        return;
      }

      console.log('✅ Vendor login successful:', response.data);
      login(response.data.user, response.data.access_token, response.data.session_info);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid vendor credentials');
    } finally {
      setLoading(false);
    }
  };

  // Delivery partner login function
  const loginDelivery = async () => {
    if (!deliveryEmail || !deliveryPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: deliveryEmail,
        password: deliveryPassword
      });

      // Check if user is delivery partner
      if (response.data.user.user_type !== 'delivery_partner') {
        setError('Access denied. Delivery partner credentials required.');
        return;
      }

      console.log('✅ Delivery partner login successful:', response.data);
      login(response.data.user, response.data.access_token, response.data.session_info);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid delivery partner credentials');
    } finally {
      setLoading(false);
    }
  };

  // Get current location for vendor registration
  const getVendorCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Use our geocoding endpoint to get address
            const response = await axios.post(`${API}/customer/geocode-address?latitude=${lat}&longitude=${lng}`);
            
            if (response.data.success) {
              const addressData = response.data;
              setVendorRegData({
                ...vendorRegData,
                address: addressData.formatted_address,
                city: addressData.city || vendorRegData.city,
                state: addressData.state || vendorRegData.state,
                latitude: addressData.latitude,
                longitude: addressData.longitude
              });
              setVendorSelectedLocation(addressData);
              alert('Current location set successfully!');
            } else {
              alert('Unable to get detailed address. Please enter manually.');
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            alert('Error getting address details. Please enter manually.');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Vendor registration function
  const submitVendorRegistration = async () => {
    if (!vendorRegData.name || !vendorRegData.mobile || !vendorRegData.address) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/vendor-registration`, {
        ...vendorRegData,
        phone: '+91' + vendorRegData.mobile.replace(/\D/g, ''),
        user_type: 'vendor_request',
        status: 'pending'
      });

      console.log('✅ Vendor registration submitted:', response.data);
      alert('Registration submitted successfully! Admin will contact you soon to create your login account.');
      
      // Reset form
      setVendorRegData({
        name: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        businessName: '',
        businessType: ''
      });
      setShowVendorRegistration(false);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delivery registration function
  const submitDeliveryRegistration = async () => {
    if (!deliveryRegData.name || !deliveryRegData.mobile || !deliveryRegData.address) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/delivery-registration`, {
        ...deliveryRegData,
        phone: '+91' + deliveryRegData.mobile.replace(/\D/g, ''),
        user_type: 'delivery_request',
        status: 'pending'
      });

      console.log('✅ Delivery registration submitted:', response.data);
      alert('Registration submitted successfully! Admin will contact you soon to create your login account.');
      
      // Reset form
      setDeliveryRegData({
        name: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        vehicleType: '',
        licenseNumber: ''
      });
      setShowDeliveryRegistration(false);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-32 right-20 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full"></div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/95 shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          {/* Logo and Face Area */}
          <div className="flex flex-col items-center space-y-4">
            {/* Face/Avatar Area */}
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl">🛵</span>
              </div>
            </div>
            
            {/* TimeSafe Logo */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-600 bg-clip-text text-transparent">
                TimeSafe
              </h1>
              <p className="text-lg font-semibold text-orange-600">Delivery</p>
              <p className="text-sm text-gray-600 mt-1">Fresh • Fast • Reliable</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            {step === 1 && 'Enter your phone number to continue'}
            {step === 2 && 'Enter the OTP sent to your phone'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Tabs - Red & Yellow Theme */}
          <div className="flex bg-gradient-to-r from-red-100 to-yellow-100 rounded-lg p-1 mb-6 shadow-inner">
            <button 
              onClick={() => {
                setLoginMode('otp');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                loginMode === 'otp' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg transform scale-105' 
                  : 'text-red-700 hover:text-red-800 hover:bg-red-50'
              }`}
            >
              👤 Customer Login
            </button>
            <button 
              onClick={() => {
                setLoginMode('vendor');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                loginMode === 'vendor' 
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg transform scale-105' 
                  : 'text-orange-700 hover:text-orange-800 hover:bg-orange-50'
              }`}
            >
              🏪 Vendor Login
            </button>
            <button 
              onClick={() => {
                setLoginMode('delivery');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                loginMode === 'delivery' 
                  ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg transform scale-105' 
                  : 'text-red-700 hover:text-red-800 hover:bg-red-50'
              }`}
            >
              🚚 Delivery Login
            </button>
            <button 
              onClick={() => {
                setLoginMode('admin');
                setError('');
                setStep(1);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                loginMode === 'admin' 
                  ? 'bg-gradient-to-r from-yellow-500 to-red-500 text-white shadow-lg transform scale-105' 
                  : 'text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50'
              }`}
            >
              👑 Admin Login
            </button>
          </div>

          {/* Admin Login Form */}
          {loginMode === 'admin' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Admin Email</Label>
                <Input
                  type="email"
                  placeholder="admin@timesafedelivery.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Admin Password</Label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              <Button 
                onClick={loginAdmin} 
                disabled={loading || !adminEmail || !adminPassword} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    👑 Login as Admin
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">
                  <strong>Default Admin:</strong><br/>
                  Email: admin@timesafedelivery.com<br/>
                  Password: admin123
                </p>
              </div>
            </>
          )}

          {/* Vendor Login Form */}
          {loginMode === 'vendor' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Vendor Email</Label>
                <Input
                  type="email"
                  placeholder="vendor@timesafe.in"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Vendor Password</Label>
                <Input
                  type="password"
                  placeholder="Enter vendor password"
                  value={vendorPassword}
                  onChange={(e) => setVendorPassword(e.target.value)}
                />
              </div>

              <Button 
                onClick={loginVendor} 
                disabled={loading || !vendorEmail || !vendorPassword} 
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    🏪 Login as Vendor
                  </>
                )}
              </Button>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-in for Vendors */}
              <FirebaseAuth 
                onAuthSuccess={(userData, idToken) => {
                  console.log('🔥 Firebase Vendor Auth Success:', userData);
                  
                  // Set vendor user data
                  setUser({
                    id: userData.uid,
                    name: userData.name,
                    email: userData.email,
                    user_type: 'vendor',
                    firebase_auth: true
                  });
                  setToken(idToken);
                  
                  // Store in localStorage
                  localStorage.setItem('user', JSON.stringify({
                    id: userData.uid,
                    name: userData.name,
                    email: userData.email,
                    user_type: 'vendor',
                    firebase_auth: true
                  }));
                  localStorage.setItem('token', idToken);
                  
                  alert(`🏪 Welcome ${userData.name}! Vendor Google Sign-in successful.`);
                }}
                API={API}
              />

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-700 text-sm">
                  <strong>Vendor Access:</strong><br/>
                  Manage products, orders, and business settings
                </p>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-gray-600 text-sm mb-3">Don't have login credentials?</p>
                <Button 
                  onClick={() => setShowVendorRegistration(true)}
                  variant="outline" 
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  📝 Register as New Vendor
                </Button>
              </div>
            </>
          )}

          {/* Delivery Partner Login Form */}
          {loginMode === 'delivery' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Delivery Partner Email</Label>
                <Input
                  type="email"
                  placeholder="delivery@timesafe.in"
                  value={deliveryEmail}
                  onChange={(e) => setDeliveryEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Delivery Partner Password</Label>
                <Input
                  type="password"
                  placeholder="Enter delivery partner password"
                  value={deliveryPassword}
                  onChange={(e) => setDeliveryPassword(e.target.value)}
                />
              </div>

              <Button 
                onClick={loginDelivery} 
                disabled={loading || !deliveryEmail || !deliveryPassword} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    🚚 Login as Delivery Partner
                  </>
                )}
              </Button>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-in for Delivery Partners */}
              <FirebaseAuth 
                onAuthSuccess={(userData, idToken) => {
                  console.log('🔥 Firebase Delivery Auth Success:', userData);
                  
                  // Set delivery partner user data
                  setUser({
                    id: userData.uid,
                    name: userData.name,
                    email: userData.email,
                    user_type: 'delivery_partner',
                    firebase_auth: true
                  });
                  setToken(idToken);
                  
                  // Store in localStorage
                  localStorage.setItem('user', JSON.stringify({
                    id: userData.uid,
                    name: userData.name,
                    email: userData.email,
                    user_type: 'delivery_partner',
                    firebase_auth: true
                  }));
                  localStorage.setItem('token', idToken);
                  
                  alert(`🚚 Welcome ${userData.name}! Delivery Partner Google Sign-in successful.`);
                }}
                API={API}
              />

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-purple-700 text-sm">
                  <strong>Delivery Partner Access:</strong><br/>
                  Accept orders, manage deliveries, and track earnings
                </p>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-gray-600 text-sm mb-3">Don't have login credentials?</p>
                <Button 
                  onClick={() => setShowDeliveryRegistration(true)}
                  variant="outline" 
                  className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  📝 Register as New Delivery Partner
                </Button>
              </div>
            </>
          )}

          {/* OTP Login Form - Clean Direct Login */}
          {loginMode === 'otp' && (
            <>
              
              {/* Step 1: Phone Number */}
              {step === 1 && (
                <>
                  {/* Phone Number Input - India (+91) Fixed */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="flex space-x-2">
                      <div className="w-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium">
                        +91
                      </div>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      console.log('🚀 Test button clicked!');
                      console.log('📱 Current phone number:', phoneNumber);
                      console.log('🔄 Current loading state:', loading);
                      console.log('🎯 Calling sendOTP function...');
                      sendOTP();
                    }}
                    disabled={loading || !phoneNumber} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Send OTP
                      </>
                    )}
                  </Button>

                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  {/* Google Sign-in Button */}
                  <FirebaseAuth 
                    onAuthSuccess={(userData, idToken) => {
                      console.log('🔥 Firebase Auth Success:', userData);
                      
                      // Set user data
                      setUser({
                        id: userData.uid,
                        name: userData.name,
                        email: userData.email,
                        user_type: 'customer',
                        firebase_auth: true
                      });
                      setToken(idToken);
                      
                      // Store in localStorage
                      localStorage.setItem('user', JSON.stringify({
                        id: userData.uid,
                        name: userData.name,
                        email: userData.email,
                        user_type: 'customer',
                        firebase_auth: true
                      }));
                      localStorage.setItem('token', idToken);
                      
                      // Show success message
                      alert(`🎉 Welcome ${userData.name}! Google Sign-in successful.`);
                    }}
                    API={API}
                  />
                  
                  {error && (
                    <div className="text-red-500 text-sm mt-2">
                      {error}
                    </div>
                  )}
                </>
              )}

              {/* Step 2: OTP Verification - Enhanced */}
              {step === 2 && (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      OTP sent to <strong>+91 {phoneNumber}</strong>
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setStep(1)}
                      className="text-xs"
                    >
                      Change number?
                    </Button>
                  </div>

                  {/* Enhanced OTP Input */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Enter 6-digit OTP</Label>
                    
                    {/* Individual OTP Input Boxes */}
                    <div className="flex justify-center space-x-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]"
                          value={otpCode[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const newOtpCode = otpCode.split('');
                            newOtpCode[index] = value.slice(-1); // Only take the last digit
                            const updatedOtp = newOtpCode.join('').slice(0, 6);
                            setOTPCode(updatedOtp);
                            
                            // Auto-focus next input
                            if (value && index < 5) {
                              const nextInput = document.getElementById(`otp-${index + 1}`);
                              if (nextInput) nextInput.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace to go to previous input
                            if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                              const prevInput = document.getElementById(`otp-${index - 1}`);
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            setOTPCode(pastedData);
                            
                            // Focus the next empty input or the last one
                            const nextIndex = Math.min(pastedData.length, 5);
                            const nextInput = document.getElementById(`otp-${nextIndex}`);
                            if (nextInput) nextInput.focus();
                          }}
                          className="w-12 h-12 text-center text-xl font-bold border-2"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    
                    {/* Fallback single input for better compatibility */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Or paste complete OTP here:</p>
                      <Input
                        type="text"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOTPCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-lg tracking-widest max-w-40 mx-auto"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  {/* Resend OTP Button */}
                  <div className="text-center">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        // Reset and resend OTP
                        setOTPCode('');
                        setError('');
                        sendOTP();
                      }}
                      className="text-blue-600 text-sm hover:text-blue-800"
                    >
                      🔄 Didn't receive OTP? Resend
                    </Button>
                  </div>
                </>
              )}

              {!isExistingUser && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Your Name</Label>
                        <Input
                          type="text"
                          placeholder="Enter your full name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </div>

                      {/* Hidden customer type - only customers can register */}
                      <input type="hidden" value="customer" />

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">🛒</span>
                          <div>
                            <p className="text-green-800 font-medium text-sm">Customer Registration</p>
                            <p className="text-green-600 text-xs">Join TimeSafe Delivery as a customer</p>
                          </div>
                        </div>
                      </div>

                  {/* Enhanced Profile Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Age</Label>
                      <Input
                        type="number"
                        placeholder="25"
                        value={userAge}
                        onChange={(e) => setUserAge(e.target.value)}
                        min="1"
                        max="120"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Gender</Label>
                      <Select value={userGender} onValueChange={setUserGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">🚹 Male</SelectItem>
                          <SelectItem value="female">🚺 Female</SelectItem>
                          <SelectItem value="other">⚧️ Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Complete Address</Label>
                    <Textarea
                      placeholder="Enter your full address (House/Flat No, Street, Locality)"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="min-h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">City</Label>
                      <Input
                        type="text"
                        placeholder="Mumbai"
                        value={userCity}
                        onChange={(e) => setUserCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">State</Label>
                      <Input
                        type="text"
                        placeholder="Maharashtra"
                        value={userState}
                        onChange={(e) => setUserState(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">PIN Code</Label>
                    <Input
                      type="text"
                      placeholder="400001"
                      value={userPincode}
                      onChange={(e) => setUserPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                  </div>
                </>
              )}

              {isExistingUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">
                    <strong>Welcome back, {userName}!</strong>
                  </p>
                  <p className="text-green-600 text-xs">
                    {userType === 'customer' && '🛒 Customer Account'}
                    {userType === 'admin' && '👑 Admin Account'}
                  </p>
                </div>
              )}

              <Button 
                onClick={verifyOTP} 
                disabled={loading || !otpCode || (!isExistingUser && !userName)} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    {isExistingUser ? 'Login' : 'Create Account'}
                  </>
                )}
              </Button>
            </>
          )}

          {/* Vendor Registration Form Modal */}
          {showVendorRegistration && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-orange-600">🏪 Vendor Registration</h3>
                  <button onClick={() => setShowVendorRegistration(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name *</Label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={vendorRegData.name}
                      onChange={(e) => setVendorRegData({...vendorRegData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Mobile Number *</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm">
                        +91
                      </span>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        value={vendorRegData.mobile}
                        onChange={(e) => setVendorRegData({...vendorRegData, mobile: e.target.value.replace(/\D/g, '')})}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">📍 Business Address *</Label>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getVendorCurrentLocation}
                          className="text-xs"
                        >
                          📍 Use Current Location
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVendorShowMapSelector(!vendorShowMapSelector)}
                          className="text-xs"
                        >
                          {vendorShowMapSelector ? 'Hide Map' : '🗺️ Select on Map'}
                        </Button>
                      </div>
                    </div>
                    
                    {vendorShowMapSelector && (
                      <div className="border rounded-lg p-3 space-y-3">
                        <CheckoutAddressSelector
                          onAddressSelect={(address) => {
                            setVendorRegData({
                              ...vendorRegData, 
                              address: address.formatted_address,
                              city: address.city || vendorRegData.city,
                              state: address.state || vendorRegData.state,
                              latitude: address.latitude,
                              longitude: address.longitude
                            });
                            setVendorSelectedLocation(address);
                            console.log('Vendor address selected:', address);
                          }}
                          selectedAddress={vendorSelectedLocation}
                        />
                      </div>
                    )}
                    
                    <Input
                      type="text"
                      placeholder="Your full business address"
                      value={vendorRegData.address}
                      onChange={(e) => setVendorRegData({...vendorRegData, address: e.target.value})}
                      className="mt-2"
                    />
                    
                    {vendorSelectedLocation && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✅ Location selected: {vendorSelectedLocation.city}, {vendorSelectedLocation.state}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">City</Label>
                      <Input
                        type="text"
                        placeholder="City"
                        value={vendorRegData.city}
                        onChange={(e) => setVendorRegData({...vendorRegData, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">State</Label>
                      <Input
                        type="text"
                        placeholder="State"
                        value={vendorRegData.state}
                        onChange={(e) => setVendorRegData({...vendorRegData, state: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Business Name</Label>
                    <Input
                      type="text"
                      placeholder="Your business name"
                      value={vendorRegData.businessName}
                      onChange={(e) => setVendorRegData({...vendorRegData, businessName: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Business Type</Label>
                    <select
                      value={vendorRegData.businessType}
                      onChange={(e) => setVendorRegData({...vendorRegData, businessType: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select business type</option>
                      <option value="mutton_shop">Mutton Shop</option>
                      <option value="meat_supplier">Meat Supplier</option>
                      <option value="butcher_shop">Butcher Shop</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-700 text-xs">
                      * Required fields. Admin will review your application and create your login account within 24-48 hours.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setShowVendorRegistration(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitVendorRegistration}
                      disabled={loading || !vendorRegData.name || !vendorRegData.mobile || !vendorRegData.address}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Registration Form Modal */}
          {showDeliveryRegistration && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-purple-600">🚚 Delivery Partner Registration</h3>
                  <button onClick={() => setShowDeliveryRegistration(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name *</Label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={deliveryRegData.name}
                      onChange={(e) => setDeliveryRegData({...deliveryRegData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Mobile Number *</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm">
                        +91
                      </span>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        value={deliveryRegData.mobile}
                        onChange={(e) => setDeliveryRegData({...deliveryRegData, mobile: e.target.value.replace(/\D/g, '')})}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Address *</Label>
                    <Input
                      type="text"
                      placeholder="Your full address"
                      value={deliveryRegData.address}
                      onChange={(e) => setDeliveryRegData({...deliveryRegData, address: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">City</Label>
                      <Input
                        type="text"
                        placeholder="City"
                        value={deliveryRegData.city}
                        onChange={(e) => setDeliveryRegData({...deliveryRegData, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">State</Label>
                      <Input
                        type="text"
                        placeholder="State"
                        value={deliveryRegData.state}
                        onChange={(e) => setDeliveryRegData({...deliveryRegData, state: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Vehicle Type</Label>
                    <select
                      value={deliveryRegData.vehicleType}
                      onChange={(e) => setDeliveryRegData({...deliveryRegData, vehicleType: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="bike">Bike/Motorcycle</option>
                      <option value="scooter">Scooter</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="car">Car</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">License Number</Label>
                    <Input
                      type="text"
                      placeholder="Driving license number (optional)"
                      value={deliveryRegData.licenseNumber}
                      onChange={(e) => setDeliveryRegData({...deliveryRegData, licenseNumber: e.target.value})}
                    />
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-purple-700 text-xs">
                      * Required fields. Admin will review your application and create your login account within 24-48 hours.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setShowDeliveryRegistration(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitDeliveryRegistration}
                      disabled={loading || !deliveryRegData.name || !deliveryRegData.mobile || !deliveryRegData.address}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 mt-4 space-y-2">
            <div>By continuing, you agree to our Terms & Privacy Policy</div>
            <div>
              <button 
                onClick={() => setShowReturnPolicy(true)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                📦 View Our Easy Return Policy
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Return Policy Modal */}
      {showReturnPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-600">📦 TimeSafe Easy Returns</h2>
              <button 
                onClick={() => setShowReturnPolicy(false)} 
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {returnPolicy ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-700 mb-2">
                    {returnPolicy.title}
                  </h3>
                  <p className="text-green-600">{returnPolicy.summary}</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3">🎯 Our Return Promise</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {returnPolicy.policy_points.map((point, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3">📝 Return Reasons We Accept</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {returnPolicy.eligible_reasons.map((reason, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-green-500">•</span>
                        <span className="text-sm">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3">🔄 Easy Return Process</h4>
                  <div className="space-y-2">
                    {returnPolicy.return_process.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-blue-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-700 mb-2">📞 Need Help?</h4>
                  <div className="text-orange-600 space-y-1">
                    <div><strong>Phone:</strong> {returnPolicy.contact.phone}</div>
                    <div><strong>Email:</strong> {returnPolicy.contact.email}</div>
                    <div><strong>Support:</strong> {returnPolicy.contact.hours}</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setShowReturnPolicy(false)}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    Got it! Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p>Loading return policy...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const userData = localStorage.getItem('user');
        const sessionData = localStorage.getItem('sessionInfo');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        if (sessionData) {
          setSessionInfo(JSON.parse(sessionData));
        }
      }
      setLoading(false); // Set loading to false after initialization
    };

    initializeAuth();
  }, [token]);

  const login = (userData, authToken, sessionData = null) => {
    setUser(userData);
    setToken(authToken);
    setSessionInfo(sessionData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (sessionData) {
      localStorage.setItem('sessionInfo', JSON.stringify(sessionData));
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionInfo(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionInfo');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, sessionInfo, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Session Info Component
const SessionInfoCard = () => {
  const { user, sessionInfo } = useAuth();
  const [currentSessionInfo, setCurrentSessionInfo] = useState(null);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const response = await axios.get(`${API}/auth/session-info`);
        setCurrentSessionInfo(response.data);
      } catch (error) {
        console.error('Error fetching session info:', error);
      }
    };

    if (user) {
      fetchSessionInfo();
      // Update session info every minute
      const interval = setInterval(fetchSessionInfo, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  if (!currentSessionInfo) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>Session Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Session:</span>
            <span className="font-medium text-green-600">
              {formatDuration(currentSessionInfo.current_session_duration_minutes)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Login:</span>
            <span className="font-medium">
              {formatDateTime(currentSessionInfo.last_login)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Logins:</span>
            <span className="font-medium">{currentSessionInfo.login_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Member Since:</span>
            <span className="font-medium">
              {formatDateTime(currentSessionInfo.account_created)}
            </span>
          </div>
        </div>
        <Separator />
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Active Session</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Auth Components
// OLD AUTH PAGE (REPLACED WITH OTP AUTHENTICATION)
/*
const AuthPage = () => {
  // ... old auth code commented out to use OTP instead
};
*/

// Customer Components
const CustomerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [nearbyVendors, setNearbyVendors] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [returnPolicy, setReturnPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Checkout address selection states
  const [checkoutAddress, setCheckoutAddress] = useState(null);
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('saved'); // 'saved' or 'map'
  
  // Notification system states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    notification_type: 'promotional',
    target_users: 'all',
    user_ids: [],
    send_sms: false,
    send_push: false,
    schedule_time: null
  });
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Firebase FCM states
  const [fcmToken, setFcmToken] = useState(null);
  const [fcmSupported, setFcmSupported] = useState(false);
  
  // Vendor-first browsing states (Zomato-style)
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [showVendorView, setShowVendorView] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showNearbyVendors, setShowNearbyVendors] = useState(true);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    latitude: null,
    longitude: null
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  // Product details modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  
  // Customer Maps States (additional)
  const [vendorLocations, setVendorLocations] = useState([]);
  const [loadingVendorMap, setLoadingVendorMap] = useState(false);
  const [selectedVendorOnMap, setSelectedVendorOnMap] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default Delhi
  
  const { user, token, logout } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchAddresses();
    fetchPayments();
    fetchVendors();
    detectLocationAndFindNearbyVendors();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      // REAL-TIME CACHE BUSTING for customer orders
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      console.log('🔄 Customer: Fetching orders with real-time cache busting...');
      const response = await axios.get(`${API}/orders?_t=${timestamp}&_r=${randomId}`, {
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const customerOrders = response.data;
      console.log('✅ Customer: Fetched orders successfully:', customerOrders.length);
      
      // Sort orders - newest first for better customer experience
      const sortedOrders = customerOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Newest first
      });
      
      setOrders(sortedOrders);
    } catch (error) {
      console.error('❌ Customer: Error fetching orders:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API}/addresses`);
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  // Fetch Return Policy
  const fetchReturnPolicy = async () => {
    try {
      const response = await axios.get(`${API}/policy/return`);
      setReturnPolicy(response.data.return_policy);
    } catch (error) {
      console.error('Failed to fetch return policy:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API}/payments`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const addToCart = (product, weightOption) => {
    const quantity = weightOption === '1kg' ? 1 : weightOption === '500g' ? 0.5 : 0.25;
    setCart([...cart, { ...product, quantity, weight_option: weightOption }]);
  };

  const buyNow = async (product, weightOption) => {
    const quantity = weightOption === '1kg' ? 1 : weightOption === '500g' ? 0.5 : 0.25;
    const cartItem = {
      ...product,
      quantity,
      weight_option: weightOption
    };
    
    // Clear existing cart and add this item
    setCart([cartItem]);
    
    // Open checkout dialog immediately (address can be selected during checkout)
    setShowCheckout(true);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      setCart([]);
      alert('🛒 Cart cleared! All items removed.');
    }
  };

  // Vendor-first browsing functions (Zomato-style)
  const selectVendor = async (vendor) => {
    try {
      console.log('🏪 Selected vendor:', vendor.name);
      setSelectedVendor(vendor);
      setShowVendorView(true);
      
      // Fetch products for this specific vendor
      const response = await axios.get(`${API}/products`);
      const allProducts = response.data;
      
      // Filter products by selected vendor
      const vendorSpecificProducts = allProducts.filter(product => 
        product.vendor_id === vendor.id
      );
      
      console.log(`🛒 Found ${vendorSpecificProducts.length} products for ${vendor.name}`);
      setVendorProducts(vendorSpecificProducts);
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      setVendorProducts([]);
    }
  };

  const backToVendors = () => {
    setSelectedVendor(null);
    setShowVendorView(false);
    setVendorProducts([]);
  };

  // Open product details modal
  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  // Close product details modal
  const closeProductDetails = () => {
    setSelectedProduct(null);
    setShowProductDetails(false);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    // Determine delivery address based on selected type
    let deliveryAddress = null;
    
    if (selectedAddressType === 'saved') {
      if (addresses.length === 0) {
        alert('Please add a delivery address first or switch to Map mode to select location.');
        return;
      }
      deliveryAddress = addresses[0];
    } else if (selectedAddressType === 'map') {
      if (!checkoutAddress) {
        alert('Please select a delivery location on the map first.');
        return;
      }
      // Convert map address to the format expected by backend
      deliveryAddress = {
        street: checkoutAddress.formatted_address,
        city: checkoutAddress.city || 'Unknown City',
        state: checkoutAddress.state || 'Unknown State',
        pincode: checkoutAddress.postal_code || '000000',
        latitude: checkoutAddress.latitude,
        longitude: checkoutAddress.longitude,
        formatted_address: checkoutAddress.formatted_address
      };
    }

    if (!deliveryAddress) {
      alert('Please select a delivery address to continue.');
      return;
    }

    try {
      const orderData = {
        vendor_id: cart[0].vendor_id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          weight_option: item.weight_option
        })),
        delivery_address: deliveryAddress,
        payment_method: paymentMethod
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setCart([]);
      setShowCheckout(false);
      fetchOrders();
      fetchPayments();
      setActiveTab('orders');
      
      // Show success message
      alert(`Order placed successfully with ${paymentMethod.replace('_', ' ').toUpperCase()}!`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // =============================================
  // NOTIFICATION SYSTEM FUNCTIONS
  // =============================================
  
  // Fetch user notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get(`${API}/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      await axios.put(`${API}/user/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Admin: Send notification
  const sendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Please fill in title and message');
      return;
    }

    try {
      setLoadingNotifications(true);
      const response = await axios.post(`${API}/admin/send-notification`, newNotification, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('✅ Notification sent successfully!');
        setNewNotification({
          title: '',
          message: '',
          notification_type: 'promotional',
          target_users: 'all',
          user_ids: [],
          send_sms: false,
          send_push: false,
          schedule_time: null
        });
        fetchNotificationHistory();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('❌ Failed to send notification');
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Admin: Fetch notification history
  const fetchNotificationHistory = async () => {
    try {
      const response = await axios.get(`${API}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotificationHistory(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  // Auto-fetch notifications for logged in users
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Admin: Fetch notification history on admin login
  useEffect(() => {
    if (user && user.user_type === 'admin' && token) {
      fetchNotificationHistory();
    }
  }, [user, token]);

  // =============================================
  // FIREBASE CLOUD MESSAGING FUNCTIONS
  // =============================================

  // Initialize FCM on app load
  useEffect(() => {
    const initializeFCM = async () => {
      const supported = isFirebaseMessagingSupported();
      setFcmSupported(supported);
      
      if (supported) {
        console.log('🔥 Firebase FCM is supported');
        
        // Request notification permission
        const token = await requestNotificationPermission();
        if (token) {
          setFcmToken(token);
          console.log('📱 FCM Token set:', token.substring(0, 20) + '...');
        }
        
        // Listen for foreground messages
        onMessageListener().then((payload) => {
          console.log('🔔 Foreground notification received:', payload);
          
          // Update local notification state
          if (payload.notification) {
            const newNotification = {
              id: Date.now().toString(),
              title: payload.notification.title,
              message: payload.notification.body,
              notification_type: 'system',
              is_read: false,
              created_at: new Date().toISOString()
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }).catch(err => console.log('Failed to listen for messages: ', err));
      } else {
        console.log('⚠️ Firebase FCM not supported on this browser');
      }
    };

    initializeFCM();
  }, []);

  // Send FCM token to backend (optional - for targeted notifications)
  const registerFCMToken = async () => {
    if (fcmToken && user && token) {
      try {
        // You can add an endpoint to save FCM tokens per user
        console.log('📝 FCM Token ready for backend registration:', fcmToken);
        // await axios.post(`${API}/user/register-fcm-token`, 
        //   { fcm_token: fcmToken }, 
        //   { headers: { Authorization: `Bearer ${token}` } }
        // );
      } catch (error) {
        console.error('Error registering FCM token:', error);
      }
    }
  };

  // FCM token registration when user logs in
  useEffect(() => {
    if (fcmToken && user && token) {
      registerFCMToken();
    }
  }, [fcmToken, user, token]);

  // =============================================
  // FIREBASE AUTHENTICATION FUNCTIONS
  // =============================================

  // Firebase ID Token verification (Python backend equivalent)
  const verifyFirebaseToken = async (idToken) => {
    try {
      console.log('🔐 Verifying Firebase ID token...');
      
      const response = await axios.post(`${API}/auth/firebase-verify-token`, {
        id_token: idToken
      });
      
      if (response.data.success) {
        console.log('✅ Firebase token verified:', response.data);
        
        if (response.data.user_exists) {
          // Existing user - login
          setUser(response.data.user_data);
          setToken(response.data.access_token || 'firebase-authenticated');
          localStorage.setItem('user', JSON.stringify(response.data.user_data));
          localStorage.setItem('token', response.data.access_token || 'firebase-authenticated');
        } else {
          // New user - show registration
          console.log('🆕 New Firebase user detected');
          return response.data.firebase_data;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Firebase token verification failed:', error);
      throw error;
    }
  };

  // Firebase user registration  
  const registerWithFirebase = async (idToken, userType = 'customer', phone = '') => {
    try {
      const response = await axios.post(`${API}/auth/firebase-register`, {
        id_token: idToken,
        user_type: userType,
        phone: phone
      });
      
      if (response.data.success) {
        console.log('✅ Firebase user registered:', response.data);
        
        setUser(response.data.user);
        setToken(response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.access_token);
        
        return response.data;
      }
    } catch (error) {
      console.error('❌ Firebase registration failed:', error);
      throw error;
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city || !newAddress.state || !validatePincode(newAddress.pincode)) {
      alert('Please fill all required fields with valid information');
      return;
    }

    try {
      const addressData = {
        ...newAddress,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null
      };
      
      await axios.post(`${API}/addresses`, addressData);
      fetchAddresses();
      setShowAddAddress(false);
      setNewAddress({
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        latitude: null,
        longitude: null
      });
      setCurrentLocation(null);
      alert('Address added successfully!');
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowChangePassword(false);
    } catch (error) {
      setPasswordError(
        error.response?.data?.detail || 
        'Failed to change password. Please try again.'
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-500',
      'accepted': 'bg-green-500',
      'prepared': 'bg-orange-500',
      'out_for_delivery': 'bg-purple-500',
      'delivered': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Payment Gateway Management Functions
  const fetchPaymentGateways = async () => {
    setLoadingGateways(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/vendor/payment-gateways`, { headers });
      setPaymentGateways(response.data.payment_gateways || []);
      console.log('✅ Vendor: Payment gateways fetched successfully:', response.data.payment_gateways?.length);
    } catch (error) {
      console.error('❌ Vendor: Error fetching payment gateways:', error);
    } finally {
      setLoadingGateways(false);
    }
  };

  const addPaymentGateway = async () => {
    if (addingGateway) return;
    
    // Validate required fields
    if (!newGateway.gateway_name || !newGateway.api_key || !newGateway.secret_key) {
      alert('❌ Please fill in all required fields');
      return;
    }
    
    setAddingGateway(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${API}/vendor/payment-gateways`, newGateway, { headers });
      
      console.log('✅ Vendor: Payment gateway added successfully:', response.data);
      alert(`✅ ${response.data.gateway_name} payment gateway added successfully!`);
      
      // Reset form and refresh list
      setNewGateway({
        gateway_type: 'stripe',
        gateway_name: '',
        api_key: '',
        secret_key: '',
        webhook_secret: '',
        currency: 'INR'
      });
      setShowAddGateway(false);
      await fetchPaymentGateways();
      
    } catch (error) {
      console.error('❌ Vendor: Error adding payment gateway:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to add payment gateway');
      }
    } finally {
      setAddingGateway(false);
    }
  };

  const togglePaymentGateway = async (gatewayId, currentStatus) => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.put(`${API}/vendor/payment-gateways/${gatewayId}/toggle`, {}, { headers });
      
      console.log('✅ Vendor: Payment gateway toggled successfully:', response.data);
      alert(`✅ ${response.data.message}`);
      
      // Refresh gateways list
      await fetchPaymentGateways();
      
    } catch (error) {
      console.error('❌ Vendor: Error toggling payment gateway:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to toggle payment gateway');
      }
    }
  };

  const deletePaymentGateway = async (gatewayId, gatewayName) => {
    if (!window.confirm(`Are you sure you want to delete ${gatewayName} payment gateway?`)) {
      return;
    }
    
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.delete(`${API}/vendor/payment-gateways/${gatewayId}`, { headers });
      
      console.log('✅ Vendor: Payment gateway deleted successfully:', response.data);
      alert(`✅ ${gatewayName} payment gateway deleted successfully!`);
      
      // Refresh gateways list
      await fetchPaymentGateways();
      
    } catch (error) {
      console.error('❌ Vendor: Error deleting payment gateway:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to delete payment gateway');
      }
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500',
      'completed': 'bg-green-500',
      'failed': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const simulatePayment = async (paymentId, action) => {
    try {
      const response = await axios.post(`${API}/payments/simulate-online`, {
        payment_id: paymentId,
        action: action
      });
      
      alert(response.data.message);
      fetchPayments(); // Refresh payments
    } catch (error) {
      console.error('Error simulating payment:', error);
      alert('Payment simulation failed');
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setNewAddress(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        // Use reverse geocoding approximation for demo
        estimateAddressFromCoords(latitude, longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        alert(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };

  const estimateAddressFromCoords = (lat, lng) => {
    // Simple city estimation based on coordinates (demo version)
    // In production, you'd use reverse geocoding API
    let estimatedCity = 'Delhi';
    let estimatedState = 'Delhi';
    
    // Simple coordinate-based city detection for major Indian cities
    if (lat >= 19.0 && lat <= 19.3 && lng >= 72.7 && lng <= 73.0) {
      estimatedCity = 'Mumbai';
      estimatedState = 'Maharashtra';
    } else if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
      estimatedCity = 'Bangalore';
      estimatedState = 'Karnataka';
    } else if (lat >= 17.3 && lat <= 17.5 && lng >= 78.3 && lng <= 78.6) {
      estimatedCity = 'Hyderabad';
      estimatedState = 'Telangana';
    } else if (lat >= 22.4 && lat <= 22.7 && lng >= 88.2 && lng <= 88.5) {
      estimatedCity = 'Kolkata';
      estimatedState = 'West Bengal';
    } else if (lat >= 26.8 && lat <= 27.0 && lng >= 80.8 && lng <= 81.0) {
      estimatedCity = 'Lucknow';
      estimatedState = 'Uttar Pradesh';
    }
    
    setNewAddress(prev => ({
      ...prev,
      city: estimatedCity,
      state: estimatedState,
      street: prev.street || `Near ${estimatedCity} Center`
    }));
  };

  const validatePincode = (pincode) => {
    // Basic Indian pincode validation
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const formatPincode = (value) => {
    // Remove non-digits and limit to 6 digits
    return value.replace(/\D/g, '').slice(0, 6);
  };

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      const vendorUsers = response.data.filter(user => user.user_type === 'vendor');
      setVendors(vendorUsers);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const detectLocationAndFindNearbyVendors = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          findNearbyVendors(latitude, longitude);
        },
        (error) => {
          console.log('Location detection failed, using default location');
          // Use default Mumbai location for demo
          const defaultLat = 19.0760;
          const defaultLng = 72.8777;
          setUserLocation({ latitude: defaultLat, longitude: defaultLng });
          findNearbyVendors(defaultLat, defaultLng);
        }
      );
    }
  };

  const findNearbyVendors = (userLat, userLng) => {
    const vendorsWithDistance = vendors.map(vendor => {
      // Generate random but consistent location for each vendor based on their ID
      const hash = vendor.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const latOffset = (hash % 20 - 10) * 0.01; // ±0.1 degree variation
      const lngOffset = ((hash * 7) % 20 - 10) * 0.01;
      
      const vendorLat = userLat + latOffset;
      const vendorLng = userLng + lngOffset;
      
      const distance = calculateDistance(userLat, userLng, vendorLat, vendorLng);
      const deliveryTime = Math.max(15, Math.round(distance * 3 + Math.random() * 10)); // 15+ minutes
      
      return {
        ...vendor,
        distance: distance,
        deliveryTime: deliveryTime,
        latitude: vendorLat,
        longitude: vendorLng,
        rating: 4.0 + (Math.random() * 1), // 4.0-5.0 rating
        totalOrders: Math.floor(Math.random() * 500) + 100 // 100-600 orders
      };
    });

    // Sort by distance and take top 6
    const nearby = vendorsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
    
    setNearbyVendors(nearby);
  };

  // Update nearby vendors when vendors data changes
  useEffect(() => {
    if (vendors.length > 0 && userLocation) {
      findNearbyVendors(userLocation.latitude, userLocation.longitude);
    }
  }, [vendors, userLocation]);

  const getDiscountPercentage = (originalPrice, currentPrice) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const generateSocialProof = (productName) => {
    // Generate random but consistent social proof based on product name
    const hash = productName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseCount = (hash % 50) + 20; // 20-70 range
    const timeframes = ['week', 'month'];
    const timeframe = timeframes[hash % 2];
    return `${baseCount}+ ordered this ${timeframe}`;
  };

  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Price range filter
    let matchesPrice = true;
    if (priceRange !== 'all') {
      const price = product.price_per_kg;
      switch (priceRange) {
        case 'under-500':
          matchesPrice = price < 500;
          break;
        case '500-800':
          matchesPrice = price >= 500 && price <= 800;
          break;
        case '800-1200':
          matchesPrice = price >= 800 && price <= 1200;
          break;
        case 'above-1200':
          matchesPrice = price > 1200;
          break;
        default:
          matchesPrice = true;
      }
    }

    return matchesSearch && matchesPrice;
  });

  // Customer Maps Functions
  const fetchAllVendorLocations = async () => {
    setLoadingVendorMap(true);
    try {
      const response = await axios.get(`${API}/maps/vendors`);
      
      if (response.data.success) {
        setVendorLocations(response.data.vendor_locations);
        console.log('✅ Customer: Vendor locations fetched for map:', response.data.vendor_locations.length);
      }
    } catch (error) {
      console.error('❌ Customer: Error fetching vendor locations:', error);
    } finally {
      setLoadingVendorMap(false);
    }
  };

  const findNearbyVendorsOnMap = async (lat, lng, radius = 10) => {
    setLoadingVendorMap(true);
    try {
      const response = await axios.get(`${API}/maps/nearby-vendors`, {
        params: {
          latitude: lat,
          longitude: lng,
          radius_km: radius
        }
      });
      
      if (response.data.success) {
        setVendorLocations(response.data.nearby_vendors);
        console.log('✅ Customer: Nearby vendors found:', response.data.nearby_vendors.length);
      }
    } catch (error) {
      console.error('❌ Customer: Error finding nearby vendors:', error);
    } finally {
      setLoadingVendorMap(false);
    }
  };

  const handleVendorMarkerClick = (vendor) => {
    setSelectedVendorOnMap(vendor);
    console.log('✅ Customer: Selected vendor on map:', vendor.business_name);
  };

  const getDirectionsToVendor = (vendor) => {
    if (userLocation) {
      const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${vendor.latitude},${vendor.longitude}`;
      window.open(directionsUrl, '_blank');
    } else {
      const directionsUrl = `https://www.google.com/maps/dir//${vendor.latitude},${vendor.longitude}`;
      window.open(directionsUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-orange-600">⏰ TimeSafe Delivery</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Cart Icon with Badge and Total */}
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-orange-600">{cart.length}</Badge>
                )}
              </div>
              
              {/* Cart Total Display */}
              {cart.length > 0 && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200">
                  <span className="text-sm font-semibold">
                    Total: ₹{cart.reduce((total, item) => total + (item.price_per_kg * item.quantity), 0).toFixed(0)}
                  </span>
                </div>
              )}
              
              {/* Clear Cart Button in Header */}
              {cart.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  🗑️ Clear
                </Button>
              )}
            </div>
            
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Order Summary</h4>
                {cart.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    🗑️ Clear All
                  </Button>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Your cart is empty</p>
                  <p className="text-xs">Add items to get started!</p>
                </div>
              ) : (
                <>
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm py-1">
                      <span>{item.name} ({item.weight_option})</span>
                      <div className="flex items-center space-x-2">
                        <span>₹{(item.price_per_kg * item.quantity).toFixed(0)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFromCart(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-semibold">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="text-lg text-green-600">₹{cart.reduce((total, item) => total + (item.price_per_kg * item.quantity), 0).toFixed(0)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold">Payment Method</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cod"
                    name="payment"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer">
                    <span>💵</span>
                    <span>Cash on Delivery</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="online"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="online" className="flex items-center space-x-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    <span>Pay Online (Demo)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">🚚 Delivery Address</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAddressType('saved')}
                    className={selectedAddressType === 'saved' ? 'bg-green-100 border-green-300' : ''}
                  >
                    📋 Saved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAddressType('map')}
                    className={selectedAddressType === 'map' ? 'bg-blue-100 border-blue-300' : ''}
                  >
                    🗺️ Map
                  </Button>
                </div>
              </div>

              {selectedAddressType === 'saved' && addresses.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">📍 {addresses[0].street}</p>
                    <p>{addresses[0].city}, {addresses[0].state} - {addresses[0].pincode}</p>
                  </div>
                  {addresses.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddressSelection(true)}
                      className="w-full text-xs"
                    >
                      Choose Different Address ({addresses.length} available)
                    </Button>
                  )}
                </div>
              )}

              {selectedAddressType === 'saved' && addresses.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No saved addresses</p>
                  <p className="text-xs">Switch to Map mode to select location</p>
                </div>
              )}

              {selectedAddressType === 'map' && (
                <div className="space-y-3">
                  <CheckoutAddressSelector
                    onAddressSelect={(address) => {
                      setCheckoutAddress(address);
                      console.log('Selected address:', address);
                    }}
                    selectedAddress={checkoutAddress}
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={placeOrder}
              >
                Confirm Order
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="home"><Home className="h-4 w-4 mr-2" />Home</TabsTrigger>
            <TabsTrigger value="nearby"><MapPin className="h-4 w-4 mr-2" />🚀 Nearby Vendors</TabsTrigger>
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="maps"><MapPin className="h-4 w-4 mr-2" />Find Vendors</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2" />Payments</TabsTrigger>
            <TabsTrigger value="addresses"><Home className="h-4 w-4 mr-2" />Addresses</TabsTrigger>
            <TabsTrigger value="about"><Info className="h-4 w-4 mr-2" />About</TabsTrigger>
            <TabsTrigger value="support"><Headphones className="h-4 w-4 mr-2" />24/7 Support</TabsTrigger>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <div className="space-y-6">
              {/* Customer Care Widget */}
              <CustomerCareWidget />
              
              {/* Hero Slideshow */}
              <HeroSlideshow />
              
              {/* Main Content - Vendor-First Browsing (Zomato Style) */}
              {!showVendorView ? (
                /* VENDORS LIST VIEW - Like Zomato Restaurants */
                <div className="space-y-6">
                  {/* Browse Vendors Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-6">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-2">🏪 Browse Vendors</h1>
                      <p className="opacity-90">Choose from trusted local meat vendors near you</p>
                      <div className="flex justify-center items-center space-x-4 mt-3">
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                          📍 {nearbyVendors.length} Vendors Available
                        </span>
                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                          ⚡ Fast Delivery
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vendors Grid - Zomato Style */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nearbyVendors.map((vendor, index) => (
                      <Card 
                        key={vendor.id} 
                        className="hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => selectVendor(vendor)}
                      >
                        <CardContent className="p-0">
                          {/* Vendor Header */}
                          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                                🏪
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{vendor.name}</h3>
                                <p className="text-sm opacity-90">Fresh Mutton Specialist</p>
                              </div>
                            </div>
                          </div>

                          {/* Vendor Details */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">4.{Math.floor(Math.random() * 5) + 3} ⭐</span>
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                📞 {vendor.phone}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                20-30 mins
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {vendor.distance || '2.5'} km
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                🥩 Fresh mutton daily • 🚚 Free delivery
                              </div>
                            </div>

                            {/* Product Count Preview */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-orange-800">
                                  📦 Available Products
                                </span>
                                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">
                                  {Math.floor(Math.random() * 15) + 8}+ items
                                </span>
                              </div>
                            </div>

                            {/* Click to Browse */}
                            <Button 
                              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 group-hover:shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectVendor(vendor);
                              }}
                            >
                              🛒 Browse Products
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* No Vendors Available */}
                  {nearbyVendors.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-6xl mb-4">📍</div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vendors Found</h3>
                      <p className="text-gray-500 mb-4">We're working to add more vendors in your area</p>
                      <Button 
                        onClick={() => window.location.reload()} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        🔄 Refresh
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* VENDOR PRODUCTS VIEW - Like Zomato Restaurant Menu */
                <div className="space-y-6">
                  {/* Vendor Header with Back Button */}
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={backToVendors}
                        className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                      >
                        ← Back to Vendors
                      </Button>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl">
                          🏪
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold">{selectedVendor?.name}</h1>
                          <p className="opacity-90">Fresh Mutton Products • Fast Delivery</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                              📦 {vendorProducts.length} Products
                            </span>
                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                              📞 {selectedVendor?.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cart Summary in Vendor View */}
                  {cart.length > 0 && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                            <div>
                              <span className="font-semibold text-green-800">
                                🛒 {cart.length} items • ₹{cart.reduce((total, item) => total + (item.price_per_kg * item.quantity), 0).toFixed(0)}
                              </span>
                              <p className="text-xs text-green-600">Ready for checkout</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={clearCart}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            🗑️ Clear
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Vendor Products Grid */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                      🥩 Fresh Mutton Products from {selectedVendor?.name}
                    </h2>
                    
                    {vendorProducts.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-6xl mb-4">🥩</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Products Available</h3>
                        <p className="text-gray-500 mb-4">This vendor hasn't added products yet</p>
                        <Button onClick={backToVendors} className="bg-green-600 hover:bg-green-700">
                          ← Browse Other Vendors
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {vendorProducts.map(product => {
                          const originalPrice = Math.round(product.price_per_kg * 1.25);
                          const discountPercentage = getDiscountPercentage(originalPrice, product.price_per_kg);
                          const socialProof = generateSocialProof(product.name);
                          
                          return (
                            <Card 
                              key={product.id} 
                              className="hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
                              onClick={() => openProductDetails(product)}
                            >
                              <CardContent className="p-0">
                                {/* Product Image Slideshow */}
                                <div className="relative">
                                  <ProductImageSlideshow product={product} />
                                  
                                  {/* Deal Badge */}
                                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded" style={{ zIndex: 20 }}>
                                    {discountPercentage}% OFF
                                  </div>
                                </div>

                                {/* Simplified Product Info - Click Photo for Details */}
                                <div className="p-2 space-y-1">
                                  <h3 className="font-semibold text-xs text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                                    {product.name}
                                  </h3>
                                  
                                  {/* Price Only */}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-green-600 text-sm">₹{product.price_per_kg}</span>
                                      <span className="text-xs text-gray-500 line-through ml-1">₹{originalPrice}</span>
                                    </div>
                                    <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold">
                                      {discountPercentage}% OFF
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs text-gray-500">per kg</p>

                                  {/* Click to View Details */}
                                  <div className="text-center mt-2">
                                    <p className="text-xs text-blue-600 font-medium bg-blue-50 py-1 rounded hover:bg-blue-100 transition-colors cursor-pointer">
                                      📸 Click photo for details
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        📍 Vendors Near You
                      </h2>
                      <p className="text-sm text-gray-600">Fresh mutton from nearby vendors • Fast delivery</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNearbyVendors(false)}
                    >
                      Hide
                    </Button>
                  </div>

                  {/* Vendor Location Map */}
                  <div className="mb-6">
                    <VendorLocationMap 
                      vendors={nearbyVendors}
                      customerLocation={currentLocation ? {
                        lat: currentLocation.latitude,
                        lng: currentLocation.longitude
                      } : null}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nearbyVendors.map(vendor => (
                      <Card key={vendor.id} className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            {/* Vendor Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {vendor.name.charAt(0)}
                            </div>
                            
                            {/* Vendor Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 truncate">{vendor.name}</h3>
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600 ml-1">{vendor.rating.toFixed(1)}</span>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-500 truncate">{vendor.email}</p>
                              
                              {/* Distance & Time */}
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center">
                                  <Navigation className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-gray-700 ml-1 font-medium">
                                    {vendor.distance < 1 ? 
                                      `${(vendor.distance * 1000).toFixed(0)}m` : 
                                      `${vendor.distance.toFixed(1)}km`
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Truck className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-gray-700 ml-1 font-medium">{vendor.deliveryTime} min</span>
                                </div>
                              </div>
                              
                              {/* Orders Badge */}
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {vendor.totalOrders}+ orders
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick Action */}
                          <Button 
                            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-xs py-2"
                            onClick={() => {
                              // Filter products by this vendor and show them
                              setSelectedCategory('all');
                              setSearchQuery(vendor.name);
                            }}
                          >
                            View Products ({products.filter(p => p.vendor_id === vendor.id).length})
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={detectLocationAndFindNearbyVendors}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      🔄 Refresh Location
                    </Button>
                  </div>
                </div>
              )}

              {/* Show Nearby Vendors Button (if hidden) */}
              {!showNearbyVendors && nearbyVendors.length > 0 && (
                <div className="text-center">
                  <Button
                    onClick={() => setShowNearbyVendors(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    📍 Show Nearby Vendors ({nearbyVendors.length})
                  </Button>
                </div>
              )}

              {/* Search and Filters Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search for mutton products..."
                      className="pl-10 h-12 text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Price Range Filter */}
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-full lg:w-48 h-12">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under-500">Under ₹500</SelectItem>
                      <SelectItem value="500-800">₹500 - ₹800</SelectItem>
                      <SelectItem value="800-1200">₹800 - ₹1200</SelectItem>
                      <SelectItem value="above-1200">Above ₹1200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Online Vendors Notice */}
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Showing products from online vendors only • Fresh & Available Now</span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Products ({products.length})
                  </Button>
                  <Button 
                    variant={selectedCategory === 'premium' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setSelectedCategory('premium')}
                  >
                    Premium Cuts
                  </Button>
                  <Button 
                    variant={selectedCategory === 'fresh' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setSelectedCategory('fresh')}
                  >
                    Fresh Arrivals
                  </Button>
                </div>
              </div>

              {/* Hero Section */}
              <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-4xl font-bold mb-2">🥩 Premium Fresh Mutton</h1>
                    <p className="text-xl opacity-90">Farm-fresh, premium quality meat delivered to your doorstep</p>
                    <div className="flex items-center mt-3">
                      <Badge className="bg-yellow-400 text-black mr-2">⚡ Fast Delivery</Badge>
                      <Badge className="bg-green-400 text-black">🌟 Premium Quality</Badge>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-2xl font-bold">Starting from</p>
                      <p className="text-3xl font-bold text-yellow-300">₹450/kg</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'Fresh Mutton Products'}
                  </h2>
                  <p className="text-gray-600">{filteredProducts.length} products found</p>
                </div>
                
                {/* Cart Actions */}
                {cart.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                      <span className="text-sm font-semibold">
                        🛒 {cart.length} items • ₹{cart.reduce((total, item) => total + (item.price_per_kg * item.quantity), 0).toFixed(0)}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={clearCart}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      🗑️ Clear All
                    </Button>
                  </div>
                )}
              </div>

              {/* Products Grid - SMALL but BEAUTIFUL design */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.slice(0, 10).map(product => {
                  const originalPrice = Math.round(product.price_per_kg * 1.25); // 25% higher original price
                  const discountPercentage = getDiscountPercentage(originalPrice, product.price_per_kg);
                  const socialProof = generateSocialProof(product.name);
                  
                  return (
                    <Card 
                      key={product.id} 
                      className="hover:shadow-lg transition-all duration-300 group cursor-pointer transform hover:scale-105 overflow-hidden rounded-xl border-2 border-gray-100 hover:border-orange-300"
                      onClick={() => openProductDetails(product)}
                    >
                      <CardContent className="p-0">
                        {/* SMALL but BEAUTIFUL Product Image */}
                        <div className="relative h-40 w-full">
                          <ProductImageSlideshow product={product} />
                          
                          {/* Better Deal Badge */}
                          <div className="absolute top-2 right-2" style={{ zIndex: 20 }}>
                            <Badge className="bg-red-500 text-white font-bold text-xs px-2 py-1 rounded-full shadow-md">
                              -{discountPercentage}%
                            </Badge>
                          </div>
                          
                          {/* Fresh Badge */}
                          <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md" style={{ zIndex: 20 }}>
                            ✅ Fresh
                          </Badge>
                        </div>

                        {/* IMPROVED Product Info - Compact but Beautiful */}
                        <div className="p-3">
                          {/* Product Name - Better typography */}
                          <h3 className="font-bold text-sm text-gray-800 mb-2 line-clamp-2 hover:text-orange-600 transition-colors leading-tight">
                            {product.name}
                          </h3>
                          
                          {/* Social Proof - Improved */}
                          <div className="flex items-center mb-2">
                            <div className="flex text-yellow-400 text-xs mr-1">
                              ★★★★☆
                            </div>
                            <span className="text-xs text-gray-600">(4.2)</span>
                          </div>

                          {/* BETTER Pricing display */}
                          <div className="flex items-center mb-3">
                            <span className="text-lg font-bold text-gray-900">₹{product.price_per_kg}</span>
                            <span className="text-sm text-gray-500 line-through ml-2">₹{originalPrice}</span>
                          </div>
                          <div className="text-xs text-green-600 font-semibold mb-3">per kg</div>

                          {/* BEAUTIFUL Add to Cart Button */}
                          <Button
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-3 text-xs mb-2 rounded-lg shadow-md transform hover:scale-105 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, '500g');
                            }}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            ADD TO CART
                          </Button>

                          {/* BEAUTIFUL Buy Now Button */}
                          <Button
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-2 px-3 text-xs mb-3 rounded-lg shadow-md transform hover:scale-105 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              buyNow(product, '500g');
                            }}
                          >
                            ⚡ BUY NOW ₹{Math.round(product.price_per_kg * 0.5)}
                          </Button>
                          
                          {/* Weight Selection - BEAUTIFUL small buttons */}
                          <div className="grid grid-cols-3 gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, '250g');
                              }}
                              className="text-xs py-2 px-1 hover:bg-orange-50 border-orange-200 hover:border-orange-400 rounded-md font-semibold"
                            >
                              250g<br />₹{Math.round(product.price_per_kg * 0.25)}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, '500g');
                              }}
                              className="text-xs py-2 px-1 hover:bg-orange-50 border-orange-200 hover:border-orange-400 rounded-md font-semibold bg-orange-50"
                            >
                              500g<br />₹{Math.round(product.price_per_kg * 0.5)}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, '1kg');
                              }}
                              className="text-xs py-2 px-1 hover:bg-orange-50 border-orange-200 hover:border-orange-400 rounded-md font-semibold"
                            >
                              1kg<br />₹{product.price_per_kg}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Load More Products Button */}
              {filteredProducts.length > 8 && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    className="px-8 py-3"
                    onClick={() => setShowAllProducts(!showAllProducts)}
                  >
                    {showAllProducts ? 'Show Less' : `View All ${filteredProducts.length} Products`}
                    {!showAllProducts && <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              )}

              {/* Main Content - End */}
            </div>
          </TabsContent>

          <TabsContent value="address">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-green-600">📍 Business Address Management</h2>
                  <p className="text-gray-600">Manage your business location for customer deliveries</p>
                </div>
                <Button 
                  onClick={() => setShowAddressModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Update Address
                </Button>
              </div>

              {/* Current Address Display */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <MapPin className="h-5 w-5" />
                    <span>Current Business Address</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAddress ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading address...</p>
                    </div>
                  ) : vendorAddress.street_address ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Street Address:</p>
                            <p className="text-gray-600">{vendorAddress.street_address}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">City:</p>
                            <p className="text-gray-600">{vendorAddress.city}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">State:</p>
                            <p className="text-gray-600">{vendorAddress.state}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">PIN Code:</p>
                            <p className="text-gray-600">{vendorAddress.postal_code}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Country:</p>
                            <p className="text-gray-600">{vendorAddress.country}</p>
                          </div>
                          {vendorAddress.latitude && vendorAddress.longitude && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Coordinates:</p>
                              <p className="text-gray-600 text-xs">
                                {vendorAddress.latitude.toFixed(6)}, {vendorAddress.longitude.toFixed(6)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {vendorAddress.formatted_address && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-semibold text-gray-700">Full Address:</p>
                            <p className="text-gray-600">{vendorAddress.formatted_address}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setShowAddressModal(true)}
                          variant="outline"
                          className="flex-1"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Edit Address
                        </Button>
                        {vendorAddress.latitude && vendorAddress.longitude && (
                          <Button
                            onClick={() => window.open(`https://www.google.com/maps?q=${vendorAddress.latitude},${vendorAddress.longitude}`, '_blank')}
                            variant="outline"
                            className="flex-1"
                          >
                            <span className="mr-2">🗺️</span>
                            View on Map
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No address information found</p>
                      <p className="text-sm mb-4">Add your business address to help customers find you</p>
                      <Button 
                        onClick={() => setShowAddressModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address Tips */}
              <Card className="bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-700">
                    <span>💡</span>
                    <span>Address Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Why add your address?</h4>
                      <ul className="space-y-1 text-yellow-700">
                        <li>• Customers can find your location easily</li>
                        <li>• Delivery partners get accurate directions</li>
                        <li>• Enables location-based customer search</li>
                        <li>• Builds trust with precise location</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Location Features:</h4>
                      <ul className="space-y-1 text-yellow-700">
                        <li>• Use current GPS location</li>
                        <li>• Manual address entry</li>
                        <li>• Google Maps integration</li>
                        <li>• Address verification</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Address Management Modal */}
            {showAddressModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-green-700">
                      📍 Update Business Address
                    </h3>
                    <Button
                      onClick={() => setShowAddressModal(false)}
                      variant="outline"
                      size="sm"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Street Address *</Label>
                      <Input
                        placeholder="Enter your street address"
                        value={vendorAddress.street_address}
                        onChange={(e) => setVendorAddress({...vendorAddress, street_address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>City *</Label>
                        <Input
                          placeholder="City"
                          value={vendorAddress.city}
                          onChange={(e) => setVendorAddress({...vendorAddress, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>State *</Label>
                        <Input
                          placeholder="State"
                          value={vendorAddress.state}
                          onChange={(e) => setVendorAddress({...vendorAddress, state: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>PIN Code</Label>
                        <Input
                          placeholder="PIN Code"
                          value={vendorAddress.postal_code}
                          onChange={(e) => setVendorAddress({...vendorAddress, postal_code: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input
                          placeholder="Country"
                          value={vendorAddress.country}
                          onChange={(e) => setVendorAddress({...vendorAddress, country: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={getCurrentLocation}
                        disabled={gettingCurrentLocation}
                        className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {gettingCurrentLocation ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Getting Location...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span>Use Current Location</span>
                          </div>
                        )}
                      </Button>

                      {vendorAddress.latitude && vendorAddress.longitude && (
                        <div className="bg-green-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-green-700">
                            ✅ Location detected: {vendorAddress.latitude.toFixed(6)}, {vendorAddress.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setShowAddressModal(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveVendorAddress}
                          disabled={savingAddress}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {savingAddress ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </div>
                          ) : (
                            'Save Address'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Nearby Vendors Tab - Fast Delivery Focus */}
          <TabsContent value="nearby">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">🚀 Nearby Vendors for Fast Delivery</h2>
                    <p className="text-green-100">Order from closest vendors to get your mutton delivered faster!</p>
                  </div>
                  <div className="text-right">
                    <Button
                      onClick={detectLocationAndFindNearbyVendors}
                      disabled={locationLoading}
                      className="bg-white text-green-600 hover:bg-gray-100"
                    >
                      {locationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                          Finding...
                        </>
                      ) : (
                        <>
                          📍 Find Near Me
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Customer Location Display */}
              {userLocation && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">📍 Your Location</p>
                        <p className="text-sm text-blue-600">
                          {userLocation.lat?.toFixed(4)}, {userLocation.lng?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nearby Vendors with Delivery Time */}
              {nearbyVendors.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">🏪 {nearbyVendors.length} Vendors Near You</h3>
                    <p className="text-sm text-gray-600">Sorted by distance for fastest delivery</p>
                  </div>

                  <div className="grid gap-4">
                    {nearbyVendors.map((vendor, index) => (
                      <Card 
                        key={vendor.vendor_id} 
                        className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${
                          index === 0 ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectVendor(vendor)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${vendor.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <h4 className="font-semibold text-lg">{vendor.business_name}</h4>
                                {index === 0 && (
                                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    ⚡ CLOSEST
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-blue-800">
                                    {vendor.distance_km} km away
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-800">
                                    {vendor.delivery_time_text || `${Math.round(vendor.distance_km * 10 + 15)}-${Math.round(vendor.distance_km * 10 + 25)} min`}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Package className="h-4 w-4 text-orange-600" />
                                  <span className="text-orange-800">
                                    {vendor.products_count || Math.floor(Math.random() * 20 + 10)} products
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Truck className="h-4 w-4 text-purple-600" />
                                  <span className="text-purple-800">
                                    ₹{vendor.delivery_fee || Math.round(vendor.distance_km * 5 + 20)} delivery
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-gray-600 mt-2">
                                📍 {vendor.formatted_address || vendor.address}
                              </p>
                            </div>
                            
                            <div className="text-right space-y-2">
                              <div className={`text-sm px-3 py-1 rounded-full font-bold ${
                                vendor.is_online 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {vendor.is_online ? '🟢 Online' : '⚪ Offline'}
                              </div>
                              
                              <Button 
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectVendor(vendor);
                                }}
                              >
                                🛒 Browse Products
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">📍</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Find Nearby Vendors</h3>
                    <p className="text-gray-600 mb-4">
                      Allow location access to find the closest mutton vendors for fastest delivery
                    </p>
                    <Button 
                      onClick={detectLocationAndFindNearbyVendors}
                      disabled={locationLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {locationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Detecting Location...
                        </>
                      ) : (
                        <>
                          📍 Find Vendors Near Me
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">My Orders</h2>
                <div className="flex items-center space-x-4">
                  {/* Real-Time Date & Time Display */}
                  <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    <span className="text-sm font-medium text-blue-800">📅</span>
                    <span className="font-mono font-bold text-blue-900 text-sm">
                      {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">📌 Recent orders at top</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    🔄 Updates every refresh • Order tracking
                  </div>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    🛒
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h3>
                  <p className="text-gray-500 mb-4">Start shopping to see your orders here!</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>🔄 Order monitoring active</span>
                  </div>
                </div>
              ) : (
                // Sort orders - newest first
                [...orders].sort((a, b) => {
                  // Recent orders first
                  const dateA = new Date(a.created_at || 0).getTime();
                  const dateB = new Date(b.created_at || 0).getTime();
                  return dateB - dateA; // Newest first
                }).map((order, index) => {
                  const isRecent = index < 3; // Mark first 3 as recent
                  const API = process.env.REACT_APP_BACKEND_URL || window.location.origin;
                  
                  return (
                    <Card key={order.id} className={`${isRecent ? 'border-2 border-blue-300 bg-blue-50' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</p>
                              {isRecent && (
                                <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                                  🔥 RECENT
                                </Badge>
                              )}
                            </div>
                            
                            {/* Enhanced Time & Date Display for Quick Action */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm mb-2">
                              <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded">
                                <Clock className="h-3 w-3 text-green-600" />
                                <span className="font-bold text-green-800">
                                  {order.order_time || new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                                <Package className="h-3 w-3 text-blue-600" />
                                <span className="font-bold text-blue-800">
                                  {order.order_date || new Date(order.created_at).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1 bg-orange-50 px-2 py-1 rounded">
                                <Truck className="h-3 w-3 text-orange-600" />
                                <span className="font-bold text-orange-800">
                                  ⏰ {order.estimated_delivery_time || "30 min"}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1 bg-purple-50 px-2 py-1 rounded">
                                <Phone className="h-3 w-3 text-purple-600" />
                                <span className="font-bold text-purple-800 text-xs">
                                  {order.customer_phone || user.phone}
                                </span>
                              </div>
                            </div>
                            
                            {/* Customer Address for Delivery */}
                            <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              📍 {order.customer_address_text || `${order.delivery_address?.street}, ${order.delivery_address?.city}`}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <Badge className={`${getStatusColor(order.status)} text-white mb-2`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              🏪 {order.vendor_name || "Vendor"}
                            </div>
                          </div>
                        </div>
                        
                        {/* ORDER ITEMS WITH IMAGES - CUSTOMER VERSION */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                              🛒 Your Items ({order.items.length} items)
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {order.items.map((item, itemIndex) => {
                                // Better image URL handling
                                let imageUrl = null;
                                if (item.image_url) {
                                  if (item.image_url.startsWith('/api/uploads/')) {
                                    imageUrl = `${API}${item.image_url}`;
                                  } else if (item.image_url.startsWith('/uploads/')) {
                                    imageUrl = `${API}/api${item.image_url}`;
                                  } else {
                                    imageUrl = item.image_url;
                                  }
                                }
                                
                                return (
                                  <div key={itemIndex} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex-shrink-0 overflow-hidden">
                                      {imageUrl ? (
                                        <img 
                                          src={imageUrl}
                                          alt={item.name || 'Product'}
                                          className="w-full h-full object-cover"
                                          onLoad={(e) => {
                                            console.log('Customer - Image loaded successfully:', imageUrl);
                                          }}
                                          onError={(e) => {
                                            console.log('Customer - Image failed to load:', imageUrl);
                                            e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">📷<br>No Image</div>';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs flex-col">
                                          <span>📷</span>
                                          <span>No Image</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {item.name || `Product ${itemIndex + 1}`}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                                          Qty: {item.quantity}
                                        </span>
                                        <span className="ml-2 inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          ₹{item.price} each
                                        </span>
                                      </p>
                                      <p className="text-xs font-medium text-gray-700 mt-1">
                                        Subtotal: ₹{item.quantity * item.price}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Pricing Breakdown with GST */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            💰 Bill Summary
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {order.items.length} items
                            </span>
                          </h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">🛒 Items Total:</span>
                              <span className="font-medium">₹{order.items_total || (order.total_amount * 0.70).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">🚚 Delivery Charge:</span>
                              <span className="font-medium text-orange-600">₹{order.delivery_charge || ((order.total_amount * 0.15)).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">📊 Subtotal:</span>
                              <span className="font-medium">₹{order.subtotal || (order.total_amount * 0.85).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between text-blue-600">
                              <span>🧾 GST ({order.gst_rate ? (order.gst_rate * 100).toFixed(0) : '18'}%):</span>
                              <span className="font-medium">₹{order.gst_amount || (order.total_amount * 0.15).toFixed(2)}</span>
                            </div>
                            
                            <div className="border-t pt-2 border-gray-300">
                              <div className="flex justify-between text-lg font-bold text-green-700">
                                <span>🎯 Total Amount:</span>
                                <span>₹{order.total_amount}</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                              <span>💳 Payment: {order.payment_method || 'Cash on Delivery'}</span>
                              <span>🏪 Commission: ₹{order.platform_commission_amount || (order.total_amount * 0.05).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="maps">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-green-600">🗺️ Find Vendors Near You</h2>
                  <p className="text-gray-600">Discover nearby mutton vendors and get directions</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={fetchAllVendorLocations}
                    variant="outline"
                    disabled={loadingVendorMap}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Show All Vendors
                  </Button>
                  <Button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setMapCenter({ lat, lng });
                            findNearbyVendorsOnMap(lat, lng, 10);
                          },
                          (error) => {
                            console.error('Geolocation error:', error);
                            alert('Unable to get your location. Showing all vendors instead.');
                            fetchAllVendorLocations();
                          }
                        );
                      } else {
                        alert('Geolocation not supported. Showing all vendors instead.');
                        fetchAllVendorLocations();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loadingVendorMap}
                  >
                    {loadingVendorMap ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Finding...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>📍</span>
                        <span>Find Nearby</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Google Maps Component */}
              <Card>
                <CardContent className="p-0">
                  <div style={{ height: '500px', width: '100%' }}>
                    <script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`}></script>
                    <div id="customerVendorMap" style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
                      {typeof window !== 'undefined' && window.google ? (
                        <GoogleMapsComponent
                          center={mapCenter}
                          zoom={12}
                          height="500px"
                          width="100%"
                          markers={vendorLocations.map(vendor => ({
                            lat: vendor.latitude,
                            lng: vendor.longitude,
                            title: vendor.business_name,
                            type: 'vendor',
                            ...vendor,
                            infoContent: `
                              <div style="max-width: 300px;">
                                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
                                  🏪 ${vendor.business_name}
                                </h3>
                                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                                  <strong>📍 Address:</strong> ${vendor.formatted_address || vendor.address || 'Address not available'}
                                </p>
                                ${vendor.phone ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">
                                  <strong>📞 Phone:</strong> ${vendor.phone}
                                </p>` : ''}
                                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                                  <strong>Status:</strong> 
                                  <span style="color: ${vendor.is_online ? '#22c55e' : '#ef4444'};">
                                    ${vendor.is_online ? '🟢 Online' : '🔴 Offline'}
                                  </span>
                                </p>
                                ${vendor.distance_km ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">
                                  <strong>Distance:</strong> ${vendor.distance_km} km away
                                </p>` : ''}
                                <div style="margin-top: 15px;">
                                  <button 
                                    onclick="window.open('https://www.google.com/maps/dir//${vendor.latitude},${vendor.longitude}', '_blank')"
                                    style="background: #4285f4; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">
                                    🗺️ Get Directions
                                  </button>
                                  <button 
                                    onclick="alert('Call ${vendor.phone || 'vendor'}')"
                                    style="background: #34a853; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                                    📞 Call Now
                                  </button>
                                </div>
                              </div>
                            `
                          }))}
                          onMarkerClick={handleVendorMarkerClick}
                          showUserLocation={true}
                          mapType="customer"
                        />
                      ) : (
                        <div style={{ 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f5f5f5',
                          borderRadius: '8px'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              border: '4px solid #f3f3f3',
                              borderTop: '4px solid #4285f4',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              margin: '0 auto 10px'
                            }}></div>
                            <p>Loading Google Maps...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📋</span>
                    <span>Vendor List</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {vendorLocations.length} vendors found
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingVendorMap ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading vendors...</p>
                    </div>
                  ) : vendorLocations.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No vendors found</p>
                      <p className="text-sm mb-4">Try expanding your search radius or check back later</p>
                      <Button onClick={fetchAllVendorLocations} className="bg-green-600 hover:bg-green-700 text-white">
                        Show All Vendors
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {vendorLocations.map((vendor) => (
                        <div key={vendor.vendor_id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg flex items-center space-x-2">
                                <span>🏪</span>
                                <span>{vendor.business_name}</span>
                                <Badge className={vendor.is_online ? 'bg-green-500' : 'bg-red-500'}>
                                  {vendor.is_online ? '🟢 Online' : '🔴 Offline'}
                                </Badge>
                              </h3>
                              <p className="text-gray-600 text-sm mt-1">
                                📍 {vendor.formatted_address || vendor.address || 'Address not available'}
                              </p>
                              {vendor.phone && (
                                <p className="text-gray-600 text-sm">
                                  📞 {vendor.phone}
                                </p>
                              )}
                              {vendor.distance_km && (
                                <p className="text-blue-600 text-sm font-medium">
                                  📏 {vendor.distance_km} km away
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => getDirectionsToVendor(vendor)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                🗺️ Directions
                              </Button>
                              {vendor.phone && (
                                <Button
                                  size="sm"
                                  onClick={() => window.open(`tel:${vendor.phone}`, '_self')}
                                  variant="outline"
                                  className="border-green-500 text-green-600 hover:bg-green-50"
                                >
                                  📞 Call
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => setMapCenter({ lat: vendor.latitude, lng: vendor.longitude })}
                                variant="outline"
                                className="border-purple-500 text-purple-600 hover:bg-purple-50"
                              >
                                👁️ View on Map
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Search Tips */}
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <span>💡</span>
                    <span>Map Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">Finding Vendors:</h4>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Click "Find Nearby" to see vendors near you</li>
                        <li>• Click on map markers for vendor details</li>
                        <li>• Use "Get Directions" for navigation</li>
                        <li>• Green markers = Online vendors</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">Map Features:</h4>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Your location shown with blue dot</li>
                        <li>• Distance calculated automatically</li>
                        <li>• Real-time vendor status</li>
                        <li>• Direct calling from map</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Payment History</h2>
              {payments.map(payment => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">Payment #{payment.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          Method: {payment.payment_method.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getPaymentStatusColor(payment.payment_status)} text-white mb-2`}>
                          {payment.payment_status.toUpperCase()}
                        </Badge>
                        <p className="font-semibold text-lg">₹{payment.amount}</p>
                      </div>
                    </div>
                    
                    {payment.payment_method === 'online' && payment.payment_status === 'pending' && (
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => simulatePayment(payment.id, 'success')}
                        >
                          Pay Now (Demo)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => simulatePayment(payment.id, 'fail')}
                        >
                          Simulate Failure
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {payments.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payments yet</p>
                    <p className="text-sm">Your payment history will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">My Addresses</h2>
                <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                  <DialogTrigger asChild>
                    <Button className="mb-4"><MapPin className="h-4 w-4 mr-2" />Add Address</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Map className="h-5 w-5 text-green-600" />
                        <span>Add New Address with Map</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Map-based Address Selection */}
                      <AddressMapSelector 
                        onAddressSelect={(location) => {
                          setNewAddress({
                            ...newAddress,
                            latitude: location.lat,
                            longitude: location.lng
                          });
                          setCurrentLocation({
                            latitude: location.lat,
                            longitude: location.lng
                          });
                        }}
                        selectedLocation={currentLocation ? {
                          lat: currentLocation.latitude,
                          lng: currentLocation.longitude
                        } : null}
                      />

                      {/* Address Form */}
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-medium text-gray-800">📝 Address Details</h4>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Street Address</label>
                          <Input
                            placeholder="House/Building number, Street name"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">City</label>
                            <Input
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">State</label>
                            <Input
                              placeholder="State"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">PIN Code</label>
                          <Input
                            placeholder="6-digit PIN code"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                            className="mt-1"
                            maxLength={6}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Address Type</label>
                          <Select 
                            value={newAddress.type} 
                            onValueChange={(value) => setNewAddress({...newAddress, type: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select address type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="home">🏠 Home</SelectItem>
                              <SelectItem value="work">🏢 Work</SelectItem>
                              <SelectItem value="other">📍 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button 
                          onClick={addAddress} 
                          disabled={!newAddress.street || !newAddress.city || !newAddress.pincode}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Save Address with Location
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {addresses.map(address => (
                <Card key={address.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium">{address.street}</p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        {address.landmark && (
                          <p className="text-sm text-gray-500">Near: {address.landmark}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{user?.name}</h3>
                      <p className="text-gray-600">Customer</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{user?.phone}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold">Security</h4>
                      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Change Password</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={changePassword} className="space-y-4">
                            <Input
                              type="password"
                              placeholder="Current Password"
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                              required
                            />
                            <Input
                              type="password"
                              placeholder="New Password (min 6 characters)"
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                              required
                            />
                            <Input
                              type="password"
                              placeholder="Confirm New Password"
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                              required
                            />
                            
                            {passwordError && (
                              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                                {passwordError}
                              </div>
                            )}
                            
                            {passwordSuccess && (
                              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
                                {passwordSuccess}
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              <Button type="submit" className="flex-1">Change Password</Button>
                              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowChangePassword(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-sm text-gray-600">Keep your account secure by using a strong password</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Session Information */}
            <SessionInfoCard />
          </TabsContent>

          <TabsContent value="about">
            <div className="space-y-6">
              {/* Company Header */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥩</div>
                    <h1 className="text-3xl font-bold text-green-800 mb-2">TimeSafe Delivery</h1>
                    <p className="text-lg text-green-700 font-medium">Fresh Mutton • Fast Delivery • Trusted Quality</p>
                  </div>
                </CardContent>
              </Card>

              {/* About Company */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2 text-blue-600" />
                    About TimeSafe Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    TimeSafe Delivery is your trusted partner for fresh, high-quality mutton delivered straight to your doorstep. 
                    We connect customers with verified local vendors, ensuring you get the freshest meat at competitive prices 
                    with lightning-fast delivery.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        🎯 Our Mission
                      </h3>
                      <p className="text-gray-600 text-sm">
                        To revolutionize the meat delivery industry by providing fresh, quality mutton 
                        with transparent pricing and reliable delivery timing.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        🌟 Our Vision
                      </h3>
                      <p className="text-gray-600 text-sm">
                        To become the most trusted platform for meat delivery, connecting communities 
                        with local vendors while maintaining the highest standards of quality and service.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-orange-500" />
                    Why Choose TimeSafe?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl mb-2">⚡</div>
                      <h4 className="font-semibold text-green-800">Fast Delivery</h4>
                      <p className="text-sm text-gray-600">Quick delivery from local vendors near you</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl mb-2">🥩</div>
                      <h4 className="font-semibold text-blue-800">Fresh Quality</h4>
                      <p className="text-sm text-gray-600">Premium fresh mutton from trusted vendors</p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl mb-2">💰</div>
                      <h4 className="font-semibold text-orange-800">Best Prices</h4>
                      <p className="text-sm text-gray-600">Competitive pricing with transparent costs</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl mb-2">📍</div>
                      <h4 className="font-semibold text-purple-800">Local Vendors</h4>
                      <p className="text-sm text-gray-600">Support local businesses in your area</p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl mb-2">🔐</div>
                      <h4 className="font-semibold text-red-800">Secure Payments</h4>
                      <p className="text-sm text-gray-600">Safe and secure payment options</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl mb-2">📞</div>
                      <h4 className="font-semibold text-green-800">24/7 Support</h4>
                      <p className="text-sm text-gray-600">Round-the-clock customer assistance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                    How TimeSafe Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-100 rounded-full p-2 text-green-800 font-bold text-sm w-8 h-8 flex items-center justify-center">1</div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Browse & Select</h4>
                        <p className="text-gray-600 text-sm">Choose from fresh mutton varieties from verified local vendors near you</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 rounded-full p-2 text-blue-800 font-bold text-sm w-8 h-8 flex items-center justify-center">2</div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Place Order</h4>
                        <p className="text-gray-600 text-sm">Add items to cart, choose payment method, and confirm your delivery address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 rounded-full p-2 text-orange-800 font-bold text-sm w-8 h-8 flex items-center justify-center">3</div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Vendor Preparation</h4>
                        <p className="text-gray-600 text-sm">Local vendor receives your order and prepares fresh mutton for delivery</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 rounded-full p-2 text-purple-800 font-bold text-sm w-8 h-8 flex items-center justify-center">4</div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Fast Delivery</h4>
                        <p className="text-gray-600 text-sm">Our delivery partners ensure your order reaches you fresh and on time</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-green-600" />
                      Get In Touch
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Customer Care</p>
                        <p className="text-sm text-gray-600">+91 7506228860</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-gray-600">support@timesafe.delivery</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">Support Hours</p>
                        <p className="text-sm text-gray-600">24/7 Available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />
                      Our Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">1000+</div>
                      <p className="text-sm text-gray-600">Happy Customers</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-800">50+</div>
                      <p className="text-sm text-gray-600">Trusted Vendors</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-800">5000+</div>
                      <p className="text-sm text-gray-600">Orders Delivered</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-800">4.8⭐</div>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Call to Action */}
              <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-2">Ready to Experience Fresh Delivery?</h3>
                  <p className="mb-4 opacity-90">Join thousands of satisfied customers who trust TimeSafe for their meat delivery needs</p>
                  <div className="flex justify-center space-x-4">
                    <Button className="bg-white text-green-600 hover:bg-gray-100">
                      Browse Products
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support">
            <CustomerCareInfo />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Enhanced Product Details Modal */}
      <ProductDetailsModal 
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={closeProductDetails}
        addToCart={addToCart}
        buyNow={buyNow}
      />
    </div>
  );
};

// Vendor Components
const VendorDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price_per_kg: '',
    image_url: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingMultipleImages, setUploadingMultipleImages] = useState(false);
  const [multipleImagePreviews, setMultipleImagePreviews] = useState([]);
  const [addingProduct, setAddingProduct] = useState(false);
  
  // Edit product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductData, setEditProductData] = useState({
    name: '',
    description: '',
    price_per_kg: '',
    image_url: '',
    image_urls: [],
    is_available: true
  });
  const [updatingProduct, setUpdatingProduct] = useState(false);
  
  // Delivery management states
  const [availableDeliveryPartners, setAvailableDeliveryPartners] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [assigningOrder, setAssigningOrder] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  
  // Vendor earnings states
  const [earningsData, setEarningsData] = useState(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  
  // Notification states
  const [soundsEnabled, setSoundsEnabled] = useState(notificationService.isSoundEnabled());
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  
  // Payment Gateway Management States
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [newGateway, setNewGateway] = useState({
    gateway_type: 'stripe',
    gateway_name: '',
    api_key: '',
    secret_key: '',
    webhook_secret: '',
    currency: 'INR'
  });
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [addingGateway, setAddingGateway] = useState(false);
  
  // Vendor Address Management States
  const [vendorAddress, setVendorAddress] = useState({
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    latitude: null,
    longitude: null,
    formatted_address: ''
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  
  // Online status state
  const [isOnline, setIsOnline] = useState(true);
  const [updatingOnlineStatus, setUpdatingOnlineStatus] = useState(false);
  
  // Order fetching state
  const [orderError, setOrderError] = useState(null);
  const [lastOrderFetch, setLastOrderFetch] = useState(null);
  
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (user?.user_type === 'vendor') {
      console.log('🔄 Loading vendor dashboard data...');
      fetchProducts();
      fetchOrders();
      fetchStats();
      fetchOnlineStatus(); // Fetch current online status
      fetchPaymentGateways(); // Fetch payment gateways
      fetchVendorAddress(); // Fetch vendor address
      
      // Load delivery management data for vendors
      console.log('🚚 Loading delivery control data...');
      fetchDeliveryManagementData();
      
      console.log('✅ All vendor dashboard data loading initiated');
    }
  }, [user, token]);

  // Fetch vendor's current online status
  const fetchOnlineStatus = async () => {
    try {
      const response = await axios.get(`${API}/vendor/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOnline(response.data.is_online);
    } catch (error) {
      console.error('Error fetching online status:', error);
    }
  };

  // Toggle vendor online/offline status
  const toggleOnlineStatus = async () => {
    if (updatingOnlineStatus) return;
    
    setUpdatingOnlineStatus(true);
    try {
      const response = await axios.put(`${API}/vendor/toggle-online`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsOnline(response.data.is_online);
      console.log(response.data.message);
    } catch (error) {
      console.error('Error toggling online status:', error);
    } finally {
      setUpdatingOnlineStatus(false);
    }
  };

  // Check for new orders and play notification sounds - REAL-TIME VERSION
  const checkForNewOrders = async () => {
    try {
      // ULTRA-AGGRESSIVE CACHE BUSTING for real-time data
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      // Prepare headers with proper authentication
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/orders?_t=${timestamp}&_r=${randomId}`, { headers });
      const currentOrders = response.data;
      
      // AGGRESSIVE SORTING: NEW ORDERS ALWAYS AT TOP - NEVER SCROLL DOWN
      const sortedOrders = currentOrders.sort((a, b) => {
        // PRIORITY 1: New orders ('placed' status) ALWAYS first
        const isNewA = a.status === 'placed';
        const isNewB = b.status === 'placed';
        
        if (isNewA && !isNewB) return -1; // A is new, B is not - A goes first  
        if (!isNewA && isNewB) return 1;  // B is new, A is not - B goes first
        
        // PRIORITY 2: If both are new orders, newest placement first
        if (isNewA && isNewB) {
          const dateA = new Date(a.created_at || a.order_date || 0).getTime();
          const dateB = new Date(b.created_at || b.order_date || 0).getTime();
          return dateB - dateA; // Newest new order first
        }
        
        // PRIORITY 3: For non-new orders, sort by status priority
        const statusPriority = { 
          'accepted': 0, 'prepared': 1, 'out_for_delivery': 2, 'delivered': 3, 'rejected': 4 
        };
        const statusA = statusPriority[a.status] || 5;
        const statusB = statusPriority[b.status] || 5;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // PRIORITY 4: Within same non-new status, newest first
        const dateA = new Date(a.created_at || a.order_date || 0).getTime();
        const dateB = new Date(b.created_at || b.order_date || 0).getTime();
        return dateB - dateA;
      });
      
      // Check for new orders (orders in 'placed' status)
      const newOrders = sortedOrders.filter(order => order.status === 'placed');
      const currentNewOrdersCount = newOrders.length;
      
      // If we have new orders, start continuous ringing
      if (currentNewOrdersCount > 0) {
        if (!isRinging) {
          console.log('🔔 NEW ORDERS FOUND! Starting notification sound...');
          setIsRinging(true);
          
          // Force initialize audio context and play sound
          try {
            await notificationService.initializeOnUserInteraction();
            await notificationService.playNewOrderSound();
            console.log('✅ New order notification sound triggered successfully');
          } catch (error) {
            console.error('❌ Error playing notification sound:', error);
            // Fallback: try browser beep
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = 800;
              gainNode.gain.value = 0.3;
              oscillator.start();
              oscillator.stop(audioContext.currentTime + 0.2);
            } catch (fallbackError) {
              console.error('❌ Fallback sound also failed:', fallbackError);
            }
          }
        }
        setNewOrdersCount(currentNewOrdersCount);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('📞 New Order Call!', {
            body: `Incoming order call - ${currentNewOrdersCount} order${currentNewOrdersCount > 1 ? 's' : ''} waiting!`,
            icon: '/favicon.ico'
          });
        }
      } else {
        // No pending orders, stop ringing
        if (isRinging) {
          console.log('No pending orders, stopping ringing');
          setIsRinging(false);
          notificationService.stopContinuousRinging();
        }
      }
      
      setLastOrderCount(currentNewOrdersCount);
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products/${user.id}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async (playSound = false) => {
    try {
      // ULTRA-AGGRESSIVE CACHE BUSTING for real-time data
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      // Prepare headers with proper authentication
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      // Add authorization header if user token exists
      if (user?.token) {
        headers.Authorization = `Bearer ${user.token}`;
      }
      
      console.log('🔄 Fetching orders with real-time cache busting...');
      const response = await axios.get(`${API}/orders?_t=${timestamp}&_r=${randomId}`, { headers });
      const currentOrders = response.data;
      
      console.log('✅ Fetched orders successfully:', currentOrders.length);
      if (currentOrders.length === 0) {
        console.log('⚠️ No orders found - this might be normal for new vendors');
      }
      
      console.log('Fetched orders with product data:', currentOrders.length);
      // Log first order items to debug product images
      if (currentOrders.length > 0 && currentOrders[0].items) {
        console.log('First order items:', currentOrders[0].items);
      }
      
      // SUPER AGGRESSIVE SORTING: NEW ORDERS ALWAYS AT TOP - NEVER SCROLL DOWN
      const sortedOrders = currentOrders.sort((a, b) => {
        // ABSOLUTE PRIORITY: New orders ('placed' status) MUST be first
        if (a.status === 'placed' && b.status !== 'placed') return -1000; // Force A to top
        if (b.status === 'placed' && a.status !== 'placed') return 1000;  // Force B to top
        
        // If both are new orders, newest first (by creation time)
        if (a.status === 'placed' && b.status === 'placed') {
          const dateA = new Date(a.created_at || a.order_date || 0).getTime();
          const dateB = new Date(b.created_at || b.order_date || 0).getTime();
          return dateB - dateA; // Newest new order at very top
        }
        
        // For non-new orders, sort by status priority and then by date
        const statusPriority = { 
          'accepted': 1000,       // Accepted orders after new orders
          'prepared': 2000,       // Then prepared orders
          'out_for_delivery': 3000, // Then delivery orders
          'delivered': 4000,      // Then completed orders
          'rejected': 5000        // Rejected orders last
        };
        
        const priorityA = statusPriority[a.status] || 6000;
        const priorityB = statusPriority[b.status] || 6000;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Within same status, newest first
        const dateA = new Date(a.created_at || a.order_date || 0).getTime();
        const dateB = new Date(b.created_at || b.order_date || 0).getTime();
        return dateB - dateA;
      });
      
      // Log sorting for debugging
      console.log('Orders sorted - New orders count:', sortedOrders.filter(o => o.status === 'placed').length);
      
      // Initialize last order count on first load
      if (lastOrderCount === 0) {
        const newOrders = sortedOrders.filter(order => order.status === 'placed');
        setLastOrderCount(newOrders.length);
      }
      
      setOrders(sortedOrders);
      setOrderError(null); // Clear any previous errors
      setLastOrderFetch(new Date()); // Track last successful fetch
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrderError(error.message || 'Failed to fetch orders');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        if (error.response.status === 401) {
          console.error('🔐 Authentication issue - user may need to log in again');
          setOrderError('Authentication required - please log in again');
        }
      }
      // Don't clear orders on error to maintain UI state
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      await axios.post(`${API}/products`, {
        ...newProduct,
        price_per_kg: parseFloat(newProduct.price_per_kg)
      });
      setNewProduct({ name: '', description: '', price_per_kg: '', image_url: '', image_urls: [] });
      setImagePreview('');
      setMultipleImagePreviews([]);
      setShowAddProduct(false);
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = `${BACKEND_URL}${response.data.image_url}`;
      setNewProduct({ ...newProduct, image_url: imageUrl });
      setImagePreview(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setNewProduct({ ...newProduct, image_url: '' });
    setImagePreview('');
  };

  // Handle multiple image uploads (up to 7)
  const handleMultipleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate maximum 7 images
    if (files.length > 7) {
      alert('Maximum 7 images allowed per product');
      return;
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name}: Please select valid image files (JPEG, PNG, or WebP)`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name}: File size must be less than 5MB`);
        return;
      }
    }

    setUploadingMultipleImages(true);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await axios.post(`${API}/upload-multiple-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      // Update product with multiple image URLs
      const imageUrls = response.data.uploaded_images.map(img => img.image_url);
      setNewProduct({ 
        ...newProduct, 
        image_urls: imageUrls,
        image_url: imageUrls[0] || '' // Set first image as main image
      });
      
      // Set preview images
      setMultipleImagePreviews(imageUrls.map(url => `${BACKEND_URL}${url}`));
      
      alert(`Successfully uploaded ${response.data.count} images!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingMultipleImages(false);
    }
  };

  const removeMultipleImages = () => {
    setNewProduct({ ...newProduct, image_urls: [], image_url: '' });
    setMultipleImagePreviews([]);
  };

  // Edit product functions
  const startEditingProduct = (product) => {
    setEditingProduct(product);
    setEditProductData({
      name: product.name || '',
      description: product.description || '',
      price_per_kg: product.price_per_kg || '',
      image_url: product.image_url || '',
      image_urls: product.image_urls || [],
      is_available: product.is_available !== false
    });
  };

  const cancelEditingProduct = () => {
    setEditingProduct(null);
    setEditProductData({
      name: '',
      description: '',
      price_per_kg: '',
      image_url: '',
      image_urls: [],
      is_available: true
    });
  };

  const updateProduct = async () => {
    if (!editProductData.name || !editProductData.description || !editProductData.price_per_kg) {
      alert('Please fill in all required fields');
      return;
    }

    setUpdatingProduct(true);
    
    try {
      const response = await axios.put(`${API}/products/${editingProduct.id}`, editProductData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the products list
      setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
      
      // Reset editing state
      cancelEditingProduct();
      alert('Product updated successfully!');
      
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Delivery Management Functions
  const fetchDeliveryManagementData = async () => {
    console.log('🔍 Fetching delivery management data...');
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        console.error('❌ No token available for delivery management');
        return;
      }

      console.log('📡 Making API calls to delivery endpoints...');
      
      // Fetch delivery management dashboard data
      const dashboardResponse = await axios.get(`${API}/delivery-management/dashboard`, { headers });
      console.log('✅ Dashboard data received:', dashboardResponse.data);
      
      setPendingOrders(dashboardResponse.data.pending_orders || []);
      setAssignedOrders(dashboardResponse.data.assigned_orders || []);
      
      console.log(`📊 Loaded ${dashboardResponse.data.pending_orders?.length || 0} pending orders`);
      console.log(`📊 Loaded ${dashboardResponse.data.assigned_orders?.length || 0} assigned orders`);

      // Fetch available delivery partners
      const partnersResponse = await axios.get(`${API}/delivery-partners/available`, { headers });
      console.log('✅ Partners data received:', partnersResponse.data);
      
      setAvailableDeliveryPartners(partnersResponse.data.delivery_partners || []);
      
      console.log(`👥 Loaded ${partnersResponse.data.delivery_partners?.length || 0} available partners`);

    } catch (error) {
      console.error('❌ Error fetching delivery management data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Set empty arrays on error to prevent crashes
      setPendingOrders([]);
      setAssignedOrders([]);
      setAvailableDeliveryPartners([]);
      
      // Show user-friendly error
      alert(`❌ Could not load delivery data: ${error.response?.data?.detail || error.message}\n\nPlease try refreshing or check your connection.`);
    }
  };

  const assignDeliveryPartner = async (orderId, deliveryPartnerId) => {
    if (assigningOrder) {
      console.log('⚠️ Assignment already in progress, skipping...');
      return;
    }
    
    console.log(`🎯 Starting assignment: Order ${orderId} → Partner ${deliveryPartnerId}`);
    setAssigningOrder(true);
    
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        throw new Error('No authentication token available');
      }

      console.log('📡 Sending assignment request to API...');
      await axios.put(`${API}/orders/${orderId}/assign-delivery-partner`, {
        delivery_partner_id: deliveryPartnerId
      }, { headers });

      console.log('✅ Assignment successful! Refreshing data...');
      
      // Refresh data after assignment
      await fetchDeliveryManagementData();
      setSelectedOrderForAssignment(null);
      
      console.log('🎉 Assignment completed successfully');
      alert('✅ Delivery partner assigned successfully!');
      
    } catch (error) {
      console.error('❌ Assignment failed:', error);
      console.error('❌ Assignment error details:', {
        orderId,
        deliveryPartnerId,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      alert(`❌ Failed to assign delivery partner!\n\nError: ${error.response?.data?.detail || error.message}\n\nPlease try again or check your connection.`);
    } finally {
      setAssigningOrder(false);
      console.log('🏁 Assignment process completed');
    }
  };

  // Fetch vendor earnings data
  const fetchEarningsData = async () => {
    setLoadingEarnings(true);
    try {
      const response = await axios.get(`${API}/vendor/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarningsData(response.data);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoadingEarnings(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      
      // Stop continuous ringing when order is acted upon
      if (status === 'accepted' || status === 'rejected') {
        setIsRinging(false);
        notificationService.stopContinuousRinging();
        console.log('Order action taken, stopping continuous ringing');
      }
      
      // Play single notification sound for status updates
      if (status === 'accepted') {
        notificationService.playOrderUpdateSound();
      } else if (status === 'prepared') {
        notificationService.playOrderReadySound();
      }
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Toggle notification sounds
  const toggleNotificationSounds = () => {
    const newState = notificationService.toggleSounds();
    setSoundsEnabled(newState);
    
    // Request notification permission if enabling sounds
    if (newState && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowChangePassword(false);
    } catch (error) {
      setPasswordError(
        error.response?.data?.detail || 
        'Failed to change password. Please try again.'
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-500',
      'accepted': 'bg-green-500',
      'prepared': 'bg-orange-500',
      'out_for_delivery': 'bg-purple-500',
      'delivered': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Vendor Address Management Functions
  const fetchVendorAddress = async () => {
    setLoadingAddress(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/vendor/address`, { headers });
      
      if (response.data.success) {
        setVendorAddress(response.data.address_info);
        console.log('✅ Vendor: Address fetched successfully:', response.data.address_info);
      }
    } catch (error) {
      console.error('❌ Vendor: Error fetching address:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by this browser');
      return;
    }
    
    setGettingCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        try {
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          const response = await axios.post(
            `${API}/vendor/get-current-address`,
            { latitude, longitude },
            { headers }
          );
          
          if (response.data.success) {
            setVendorAddress({
              ...vendorAddress,
              latitude: response.data.latitude,
              longitude: response.data.longitude,
              formatted_address: response.data.formatted_address,
              city: response.data.city,
              state: response.data.state,
              postal_code: response.data.postal_code,
              country: response.data.country
            });
            
            console.log('✅ Current location detected:', response.data);
            alert(`✅ Current location detected!\nAddress: ${response.data.formatted_address}`);
          }
        } catch (error) {
          console.error('❌ Error getting current address:', error);
          alert('❌ Failed to get address from current location');
        } finally {
          setGettingCurrentLocation(false);
        }
      },
      (error) => {
        let message = 'Unable to get your current location.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        alert(`❌ ${message}`);
        setGettingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const saveVendorAddress = async () => {
    if (!vendorAddress.street_address || !vendorAddress.city || !vendorAddress.state) {
      alert('❌ Please fill in all required address fields');
      return;
    }
    
    setSavingAddress(true);
    
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${API}/vendor/save-address`, vendorAddress, { headers });
      
      if (response.data.success) {
        console.log('✅ Vendor: Address saved successfully:', response.data);
        alert('✅ Address saved successfully!');
        setShowAddressModal(false);
      }
    } catch (error) {
      console.error('❌ Vendor: Error saving address:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to save address');
      }
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-600">🏪 TimeSafe Vendor Portal</h1>
            

            {/* Online Status Badge */}
            <Badge className={`${isOnline ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
              {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </Badge>
            
            {isRinging && (
              <Badge className="bg-red-600 text-white animate-pulse">
                📞 INCOMING ORDER CALL - {newOrdersCount} Order{newOrdersCount > 1 ? 's' : ''}!
              </Badge>
            )}
            {!isRinging && newOrdersCount > 0 && (
              <Badge className="bg-red-500 text-white text-lg px-4 py-2 animate-bounce">
                🔥 {newOrdersCount} NEW Order{newOrdersCount > 1 ? 's' : ''}
              </Badge>
            )}
            
            {/* Real-time Order Counter */}
            <div className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded border">
              📦 {orders.length} Orders (Live Count)
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                // Properly activate audio context on user interaction
                await notificationService.initializeOnUserInteraction();
                const newState = notificationService.toggleSounds();
                setSoundsEnabled(newState);
                
                if (newState) {
                  // Test sound immediately when turned on
                  setTimeout(() => {
                    notificationService.testSound();
                  }, 100);
                  alert('🔊 Notification sounds activated! You should hear a test ring.');
                } else {
                  notificationService.stopAllSounds();
                  setIsRinging(false);
                  alert('🔇 Notification sounds disabled.');
                }
              }}
              className={`flex items-center space-x-2 ${soundsEnabled ? 'text-green-600' : 'text-gray-400'}`}
            >
              {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {soundsEnabled ? 'Sounds On' : 'Sounds Off'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log('🔊 Testing vendor notification sound...');
                
                // Ensure audio is activated
                await notificationService.initializeOnUserInteraction();
                
                // Test the exact same sound used for new orders
                await notificationService.testSound();
                
                // Show feedback
                alert('🔊 SOUND TEST!\n\n✅ Did you hear the notification ring?\n\n📱 This is the same sound that plays when new orders arrive.\n\nIf no sound: Check your device volume and browser permissions.');
              }}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Test Ring</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRinging(false);
                notificationService.stopAllSounds();
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-800"
            >
              <BellOff className="h-4 w-4" />
              <span className="hidden sm:inline">Stop</span>
            </Button>
            
            {/* Online/Offline Toggle Button */}
            <Button
              variant={isOnline ? "default" : "outline"}
              size="sm"
              onClick={toggleOnlineStatus}
              disabled={updatingOnlineStatus}
              className={`flex items-center space-x-2 ${isOnline ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-gray-400 text-gray-600 hover:bg-gray-100'}`}
            >
              {updatingOnlineStatus ? (
                <Package className="h-4 w-4 animate-spin" />
              ) : isOnline ? (
                <div className="h-4 w-4 rounded-full bg-green-400"></div>
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-400"></div>
              )}
              <span className="hidden sm:inline">
                {updatingOnlineStatus ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
              </span>
            </Button>
            
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              {/* Notification Panel */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">🔔 Notifications</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotificationPanel(false)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                            !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><Store className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="products"><Package className="h-4 w-4 mr-2" />Products</TabsTrigger>
            <TabsTrigger value="address"><MapPin className="h-4 w-4 mr-2" />Address</TabsTrigger>
            <TabsTrigger value="payment-gateways"><CreditCard className="h-4 w-4 mr-2" />Payment Gateways</TabsTrigger>
            <TabsTrigger value="orders"><Clock className="h-4 w-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="delivery"><Truck className="h-4 w-4 mr-2" />Delivery Control</TabsTrigger>
            <TabsTrigger value="earnings"><CreditCard className="h-4 w-4 mr-2" />My Earnings</TabsTrigger>
            <TabsTrigger value="support"><Headphones className="h-4 w-4 mr-2" />24/7 Support</TabsTrigger>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {/* Customer Care Widget */}
            <CustomerCareWidget />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_products || 0}</p>
                      <p className="text-sm text-gray-600">Total Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_orders || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.pending_orders || 0}</p>
                      <p className="text-sm text-gray-600">Pending Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">My Products</h2>
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                      <form onSubmit={addProduct} className="space-y-4">
                        <Input
                          placeholder="Product Name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                        <Textarea
                          placeholder="Product Description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          required
                        />
                        <Input
                          type="number"
                          placeholder="Price per KG"
                          value={newProduct.price_per_kg}
                          onChange={(e) => setNewProduct({...newProduct, price_per_kg: e.target.value})}
                          required
                        />
                        
                        {/* Image Upload Section */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Product Image</label>
                          
                          {/* Image Preview */}
                          {imagePreview && (
                            <div className="relative">
                              <img 
                                src={imagePreview} 
                                alt="Product preview" 
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                                disabled={uploadingImage}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              {uploadingImage && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                                  <div className="text-white text-sm flex items-center space-x-2">
                                    <div className="spinner"></div>
                                    <span>Processing...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* File Upload Input */}
                          <div className="flex flex-col space-y-2">
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {uploadingImage && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <div className="flex items-center space-x-2 text-sm text-orange-600">
                                    <div className="spinner border-orange-600"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {uploadingImage && (
                              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="spinner border-orange-600"></div>
                                  <div>
                                    <p className="text-sm font-medium text-orange-800">Uploading image...</p>
                                    <p className="text-xs text-orange-600">Please wait while we process your image</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!uploadingImage && imagePreview && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-green-800">Image ready!</p>
                                    <p className="text-xs text-green-600">Your image has been processed successfully</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* OR Divider */}
                          <div className="flex items-center space-x-2">
                            <Separator className="flex-1" />
                            <span className="text-xs text-gray-500 px-2">OR</span>
                            <Separator className="flex-1" />
                          </div>
                          
                          {/* URL Input */}
                          <Input
                            placeholder="Image URL (optional)"
                            value={newProduct.image_url}
                            onChange={(e) => {
                              setNewProduct({...newProduct, image_url: e.target.value});
                              if (e.target.value && !uploadingImage) {
                                setImagePreview(e.target.value);
                              }
                            }}
                            disabled={uploadingImage}
                          />
                          
                          <p className="text-xs text-gray-500">
                            Upload an image file or provide an image URL. Supported formats: JPEG, PNG, WebP (max 5MB)
                          </p>
                        </div>

                        {/* Multiple Images Upload Section */}
                        <div className="space-y-3 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Additional Product Images (Up to 7 total)</label>
                            <Badge variant="secondary" className="text-xs">
                              {multipleImagePreviews.length}/7 images
                            </Badge>
                          </div>
                          
                          {/* Multiple Images Preview */}
                          {multipleImagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {multipleImagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={preview}
                                    alt={`Product image ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-md border"
                                  />
                                  <Badge className="absolute top-1 left-1 text-xs bg-blue-500">
                                    {index + 1}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Multiple File Upload Input */}
                          <div className="flex flex-col space-y-2">
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleMultipleImageUpload}
                                disabled={uploadingMultipleImages}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {uploadingMultipleImages && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                                    <div className="spinner border-blue-600"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {uploadingMultipleImages && (
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="spinner border-blue-600"></div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-800">Uploading multiple images...</p>
                                    <p className="text-xs text-blue-600">Processing your product gallery</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {multipleImagePreviews.length > 0 && (
                              <div className="flex items-center justify-between">
                                <div className="bg-green-50 border border-green-200 rounded-md p-2">
                                  <p className="text-sm font-medium text-green-800">
                                    ✓ {multipleImagePreviews.length} image{multipleImagePreviews.length > 1 ? 's' : ''} ready!
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={removeMultipleImages}
                                  disabled={uploadingMultipleImages}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  Clear All
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500">
                            📸 Upload up to 7 high-quality images to showcase your product from different angles. First image will be the main display image.
                          </p>
                        </div>
                      </form>
                    </div>
                    
                    {/* Fixed Bottom Button */}
                    <div className="border-t pt-4 bg-white">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={uploadingImage || addingProduct}
                        onClick={addProduct}
                      >
                        {addingProduct ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="spinner"></div>
                            <span>Adding Product...</span>
                          </div>
                        ) : uploadingImage ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="spinner"></div>
                            <span>Wait for Upload...</span>
                          </div>
                        ) : (
                          'Add Product'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Product Dialog */}
                <Dialog open={!!editingProduct} onOpenChange={() => editingProduct && cancelEditingProduct()}>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input
                          value={editProductData.name}
                          onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                          placeholder="e.g., Premium Mutton"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editProductData.description}
                          onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })}
                          placeholder="Describe your product..."
                          className="min-h-20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Price per Kg (₹)</Label>
                        <Input
                          type="number"
                          value={editProductData.price_per_kg}
                          onChange={(e) => setEditProductData({ ...editProductData, price_per_kg: e.target.value })}
                          placeholder="e.g., 650"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Image URL (Optional)</Label>
                        <Input
                          value={editProductData.image_url}
                          onChange={(e) => setEditProductData({ ...editProductData, image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="editAvailable"
                          checked={editProductData.is_available}
                          onChange={(e) => setEditProductData({ ...editProductData, is_available: e.target.checked })}
                        />
                        <Label htmlFor="editAvailable">Product Available</Label>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={cancelEditingProduct}
                          disabled={updatingProduct}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={updateProduct}
                          disabled={updatingProduct}
                          className="flex-1"
                        >
                          {updatingProduct ? (
                            <div className="flex items-center space-x-2">
                              <div className="spinner border-white"></div>
                              <span>Updating...</span>
                            </div>
                          ) : (
                            'Update Product'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <Card key={product.id}>
                    <div className="relative">
                      <ProductImageSlideshow product={product} />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <p className="font-bold text-green-600">₹{product.price_per_kg}/kg</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={product.is_available ? 'bg-green-500' : 'bg-red-500'}>
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingProduct(product)}
                            className="h-7 px-2 text-xs"
                          >
                            ✏️ Edit
                          </Button>
                          {product.image_url && (
                            <span className="text-xs text-gray-500">📷</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Order Management</h2>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>📌 New orders pinned to top</span>
                  </div>
                  {newOrdersCount > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {newOrdersCount} NEW at top!
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>🔥 NEW Orders (Always Top)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>⚡ Processing Orders</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>✅ Completed Orders</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  🔄 Updates every refresh • Order tracking
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    {orderError ? '⚠️' : '📦'}
                  </div>
                  
                  {orderError ? (
                    <>
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Orders</h3>
                      <p className="text-red-600 mb-4">{orderError}</p>
                      <button 
                        onClick={() => fetchOrders(false)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        🔄 Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h3>
                      <p className="text-gray-500 mb-4">Orders will appear here when customers place them</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>🔄 Order monitoring active</span>
                      </div>
                      {lastOrderFetch && (
                        <p className="text-xs text-gray-400 mt-2">
                          Last checked: {lastOrderFetch.toLocaleTimeString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                orders.map((order, index) => {
                const isNewOrder = order.status === 'placed';
                const isAcceptedOrder = order.status === 'accepted';
                const orderAge = new Date().getTime() - new Date(order.created_at || order.order_date).getTime();
                const isVeryNew = orderAge < 10 * 60 * 1000; // Less than 10 minutes old
                
                return (
                  <div key={order.id}>
                    {/* Section Separator */}
                    {index === 0 && isNewOrder && (
                      <div className="flex items-center justify-center py-2 mb-4">
                        <div className="flex-1 border-t border-red-300"></div>
                        <div className="px-4 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          🔥 NEW ORDERS - PINNED AT TOP
                        </div>
                        <div className="flex-1 border-t border-red-300"></div>
                      </div>
                    )}
                    {/* Accepted Orders Section */}
                    {!isNewOrder && index > 0 && orders[index-1].status === 'placed' && (
                      <div className="flex items-center justify-center py-2 mb-4 mt-6">
                        <div className="flex-1 border-t border-blue-300"></div>
                        <div className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          ⚡ PROCESSING ORDERS
                        </div>
                        <div className="flex-1 border-t border-blue-300"></div>
                      </div>
                    )}
                    
                    <Card className={`mb-4 ${isNewOrder ? 'ring-2 ring-red-300 bg-red-50 border-red-200 shadow-lg' : isAcceptedOrder ? 'ring-1 ring-blue-200 bg-blue-50' : ''} transition-all duration-300`}>
                    <CardContent className="p-6">
                      {/* Pinned indicator for new orders */}
                      {isNewOrder && (
                        <div className="flex items-center justify-between mb-3 p-2 bg-red-100 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-2 text-red-700">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">📌 PINNED TO TOP - New Order</span>
                          </div>
                          <Badge className="bg-red-500 text-white animate-pulse text-xs">
                            🔥 URGENT RESPONSE NEEDED
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                            {isNewOrder && (
                              <Badge className="bg-red-500 text-white animate-pulse text-xs">
                                🔥 NEW
                              </Badge>
                            )}
                            {isVeryNew && !isNewOrder && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                ⚡ RECENT
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="font-semibold text-lg mt-2">₹{order.total_amount}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    
                    {/* Product Images for Easy Packing */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          📦 Items to Pack ({order.items.length} items)
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {order.items.map((item, index) => {
                            // Better image URL handling
                            let imageUrl = null;
                            if (item.image_url) {
                              if (item.image_url.startsWith('/api/uploads/')) {
                                imageUrl = `${API}${item.image_url}`;
                              } else if (item.image_url.startsWith('/uploads/')) {
                                imageUrl = `${API}/api${item.image_url}`;
                              } else {
                                imageUrl = item.image_url;
                              }
                            }
                            
                            return (
                              <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                {/* Product Image */}
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex-shrink-0 overflow-hidden">
                                  {imageUrl ? (
                                    <img 
                                      src={imageUrl}
                                      alt={item.name || 'Product'}
                                      className="w-full h-full object-cover"
                                      onLoad={(e) => {
                                        console.log('Image loaded successfully:', imageUrl);
                                      }}
                                      onError={(e) => {
                                        console.log('Image failed to load:', imageUrl);
                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">📷<br>No Image</div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs flex-col">
                                      <span>📷</span>
                                      <span>No Image</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.name || `Product ${index + 1}`}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                                      ₹{item.price} each
                                    </span>
                                  </p>
                                  <p className="text-xs font-medium text-gray-700 mt-1">
                                    Total: ₹{item.quantity * item.price}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Order Actions - Fixed Bottom Position */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex flex-col space-y-3">
                        {order.status === 'placed' && (
                          <>
                            <p className="text-sm font-medium text-red-700 flex items-center">
                              ⚠️ Action Required: This order needs your response
                            </p>
                            <div className="flex space-x-3">
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'accepted')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                              >
                                ✅ Accept Order
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'rejected')}
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-50 py-3"
                              >
                                ❌ Reject
                              </Button>
                            </div>
                          </>
                        )}
                        
                        {order.status === 'accepted' && (
                          <>
                            <p className="text-sm font-medium text-blue-700 flex items-center">
                              👨‍🍳 Order accepted - Ready to prepare?
                            </p>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'prepared')}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
                            >
                              🍽️ Mark as Prepared (Ready for Delivery)
                            </Button>
                          </>
                        )}
                        
                        {order.status === 'prepared' && (
                          <div className="text-center py-2">
                            <p className="text-sm font-medium text-green-700 flex items-center justify-center">
                              ✅ Order prepared - Waiting for delivery partner pickup
                            </p>
                          </div>
                        )}
                        
                        {order.status === 'delivered' && (
                          <div className="text-center py-2">
                            <p className="text-sm font-medium text-gray-700 flex items-center justify-center">
                              🎉 Order completed successfully!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  </div>
                );
              }))}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-green-100 text-green-600 text-xl font-bold">
                        {user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{user?.name}</h3>
                      <p className="text-gray-600">Vendor • {user?.business_name || 'Business Owner'}</p>
                      {user?.business_type && (
                        <Badge variant="outline" className="mt-1 capitalize">
                          {user.business_type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user?.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user?.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm capitalize">{user?.gender || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Business Address</h4>
                      <div className="space-y-3">
                        {user?.address && (
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div className="text-sm">
                              <p>{user.address}</p>
                              {user.city && user.state && (
                                <p className="text-gray-600">
                                  {user.city}, {user.state} {user.pincode}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {(!user?.address && !user?.city) && (
                          <div className="flex items-center space-x-2 text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">Address not provided</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  {(user?.business_name || user?.business_type) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Business Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {user?.business_name && (
                            <div className="flex items-center space-x-2">
                              <Store className="h-4 w-4 text-gray-500" />
                              <div>
                                <span className="text-xs text-gray-500">Business Name</span>
                                <p className="text-sm font-medium">{user.business_name}</p>
                              </div>
                            </div>
                          )}
                          
                          {user?.business_type && (
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-500" />
                              <div>
                                <span className="text-xs text-gray-500">Business Type</span>
                                <p className="text-sm font-medium capitalize">
                                  {user.business_type.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  
                  {/* Account Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{stats.total_products || 0}</p>
                      <p className="text-xs text-gray-600">Total Products</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{stats.total_orders || 0}</p>
                      <p className="text-xs text-gray-600">Total Orders</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <CreditCard className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-600">₹{stats.total_revenue || 0}</p>
                      <p className="text-xs text-gray-600">Revenue</p>
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">Security</h4>
                        <p className="text-sm text-gray-600">Keep your vendor account secure</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowChangePassword(!showChangePassword)}
                      >
                        Change Password
                      </Button>
                    </div>
                    
                    {showChangePassword && (
                      <Card className="p-4 bg-gray-50">
                        <div className="space-y-3">
                          <Input
                            type="password"
                            placeholder="Current Password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          />
                          <Input
                            type="password"
                            placeholder="New Password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          />
                          <Input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          />
                          
                          {passwordError && (
                            <div className="text-red-600 text-sm">{passwordError}</div>
                          )}
                          {passwordSuccess && (
                            <div className="text-green-600 text-sm">{passwordSuccess}</div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handlePasswordChange}>
                              Update Password
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setShowChangePassword(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Session Information */}
            <SessionInfoCard />
          </TabsContent>

          <TabsContent value="delivery">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-green-600">🚚 Your Delivery Management</h2>
                  <p className="text-gray-600">Assign delivery partners to your orders efficiently</p>
                </div>
                <Button 
                  onClick={fetchDeliveryManagementData}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>🔄 Refresh Orders</span>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{pendingOrders.length}</div>
                    <div className="text-sm opacity-90">📦 Need Assignment</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{assignedOrders.length}</div>
                    <div className="text-sm opacity-90">🚛 Out for Delivery</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-400 to-teal-500 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{availableDeliveryPartners.filter(p => p.status === 'available').length}</div>
                    <div className="text-sm opacity-90">👥 Available Partners</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Orders - PRIMARY FOCUS FOR VENDORS */}
                <Card className="ring-2 ring-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-700">
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <span>🎯 YOUR ORDERS - Select Delivery Partner</span>
                      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                        {pendingOrders.length} pending
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-3">
                    {pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-orange-600">
                        <Package className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                        <p className="font-medium">🎉 All orders assigned!</p>
                        <p className="text-sm">No pending assignments right now</p>
                      </div>
                    ) : (
                      pendingOrders.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-600">👤 {order.customer_name}</p>
                              <p className="text-sm text-blue-600">📞 {order.customer_phone}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {order.delivery_address?.address || order.delivery_address?.street || 'Address not provided'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">₹{order.total_amount}</p>
                              <Badge className="bg-yellow-500 text-white text-xs">
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setSelectedOrderForAssignment(order)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
                          >
                            🎯 SELECT DELIVERY PARTNER
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Assigned Orders - MONITORING */}
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-700">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>📊 Delivery Status Monitor</span>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                        {assignedOrders.length} active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-3">
                    {assignedOrders.length === 0 ? (
                      <div className="text-center py-8 text-blue-600">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                        <p className="font-medium">No active deliveries</p>
                        <p className="text-sm">Orders will appear here once assigned</p>
                      </div>
                    ) : (
                      assignedOrders.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-600">👤 {order.customer_name}</p>
                              <div className="bg-blue-100 rounded-md p-2 mt-2">
                                <p className="text-sm text-blue-700 font-medium">🚚 {order.delivery_partner_name}</p>
                                <p className="text-xs text-blue-600">📞 {order.delivery_partner_phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">₹{order.total_amount}</p>
                              <Badge className="bg-blue-500 text-white text-xs">
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            📍 {order.delivery_address?.address || order.delivery_address?.street || 'Address not provided'}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Assignment Dialog */}
              {selectedOrderForAssignment && (
                <Dialog open={!!selectedOrderForAssignment} onOpenChange={() => setSelectedOrderForAssignment(null)}>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-orange-700">
                        🎯 Select Best Delivery Partner
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                        <p className="font-semibold text-gray-800">📦 Order #{selectedOrderForAssignment.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">👤 Customer: {selectedOrderForAssignment.customer_name}</p>
                        <p className="text-sm text-blue-600">📞 {selectedOrderForAssignment.customer_phone}</p>
                        <p className="text-lg font-bold text-green-600">💰 ₹{selectedOrderForAssignment.total_amount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {selectedOrderForAssignment.delivery_address?.address || 'Address provided'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Available Delivery Partners:</label>
                          <Badge variant="outline" className="text-xs">
                            {availableDeliveryPartners.filter(p => p.status === 'available').length} available
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {availableDeliveryPartners.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <p className="text-sm">No delivery partners available</p>
                              <p className="text-xs">Please try again later</p>
                            </div>
                          ) : (
                            availableDeliveryPartners.map(partner => (
                              <div
                                key={partner.id}
                                onClick={() => !assigningOrder && assignDeliveryPartner(selectedOrderForAssignment.id, partner.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                  assigningOrder ? 'opacity-50 cursor-not-allowed' : 
                                  partner.status === 'available' ? 
                                  'hover:bg-green-50 hover:border-green-300 hover:shadow-md transform hover:-translate-y-1' : 
                                  'bg-red-50 border-red-200 opacity-75'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">🚚 {partner.name}</p>
                                    <p className="text-sm text-blue-600">📞 {partner.phone}</p>
                                    {partner.distance_km !== undefined && (
                                      <p className="text-xs text-purple-600">📍 {partner.distance_km} km away</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge className={`text-xs ${partner.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`}>
                                      {partner.status === 'available' ? '✅ Available' : '🔴 Busy'}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {partner.active_deliveries} active deliveries
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {assigningOrder && (
                        <div className="flex items-center justify-center space-x-3 py-4 bg-blue-50 rounded-lg">
                          <div className="spinner border-blue-600"></div>
                          <span className="text-blue-700 font-medium">🎯 Assigning delivery partner...</span>
                        </div>
                      )}
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                          💡 <strong>Tip:</strong> Choose partners with fewer active deliveries for faster delivery. 
                          Closer partners will reach customers quicker!
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="support">
            <CustomerCareInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Delivery Partner Components
const DeliveryDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('available');
  
  // Notification states for delivery partner
  const [soundsEnabled, setSoundsEnabled] = useState(notificationService.isSoundEnabled());
  const [lastAvailableCount, setLastAvailableCount] = useState(0);
  const [newAvailableCount, setNewAvailableCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  
  const { user, token, logout } = useAuth();

  useEffect(() => {
    fetchAvailableOrders();
    fetchMyOrders();
    fetchStats();
  }, []);

  // Check for new orders ready for pickup
  const checkForReadyOrders = async () => {
    try {
      // Add cache busting to ensure fresh data
      const timestamp = Date.now();
      const response = await axios.get(`${API}/orders/available?_t=${timestamp}`, {
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const currentAvailable = response.data;
      const currentCount = currentAvailable.length;
      
      // If we have more available orders than before, play notification sound
      if (currentCount > lastAvailableCount && lastAvailableCount > 0) {
        notificationService.playOrderReadySound();
        setNewAvailableCount(currentCount - lastAvailableCount);
        
        // Show browser notification if permission granted  
        if (Notification.permission === 'granted') {
          new Notification('Orders Ready for Pickup!', {
            body: `${currentCount} order${currentCount > 1 ? 's' : ''} ready for delivery.`,
            icon: '/favicon.ico'
          });
        }
      }
      
      setLastAvailableCount(currentCount);
      setAvailableOrders(currentAvailable);
    } catch (error) {
      console.error('Error checking for ready orders:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      // Add cache busting to force fresh data
      const timestamp = Date.now();
      const response = await axios.get(`${API}/orders/available?_t=${timestamp}`, {
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const currentAvailable = response.data;
      
      // Initialize last available count on first load
      if (lastAvailableCount === 0) {
        setLastAvailableCount(currentAvailable.length);
      }
      
      setAvailableOrders(currentAvailable);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      // Add cache busting to force fresh data
      const timestamp = Date.now();
      const response = await axios.get(`${API}/orders?_t=${timestamp}`, {
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setMyOrders(response.data);
    } catch (error) {
      console.error('Error fetching my orders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const assignOrder = async (orderId) => {
    try {
      await axios.put(`${API}/orders/${orderId}/assign`);
      
      // Play notification sound when order is assigned
      notificationService.playOrderUpdateSound();
      
      fetchAvailableOrders();
      fetchMyOrders();
    } catch (error) {
      console.error('Error assigning order:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      
      // Play notification sound for delivery completion
      if (status === 'delivered') {
        notificationService.playOrderUpdateSound();
      }
      
      fetchMyOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Toggle notification sounds for delivery partner
  const toggleNotificationSounds = () => {
    const newState = notificationService.toggleSounds();
    setSoundsEnabled(newState);
    
    // Request notification permission if enabling sounds
    if (newState && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-500',
      'accepted': 'bg-green-500',
      'prepared': 'bg-orange-500',
      'out_for_delivery': 'bg-purple-500',
      'delivered': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-purple-600">🚚 TimeSafe Delivery Portal</h1>
            {newAvailableCount > 0 && (
              <Badge className="bg-blue-500 text-white animate-pulse">
                {newAvailableCount} Ready for Pickup!
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotificationSounds}
              className={`flex items-center space-x-2 ${soundsEnabled ? 'text-blue-600' : 'text-gray-400'}`}
            >
              {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {soundsEnabled ? 'Sounds On' : 'Sounds Off'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notificationService.testSound()}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Test</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRinging(false);
                notificationService.stopAllSounds();
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-800"
            >
              <BellOff className="h-4 w-4" />
              <span className="hidden sm:inline">Stop</span>
            </Button>
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Truck className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.assigned_orders || 0}</p>
                  <p className="text-sm text-gray-600">Assigned Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.completed_deliveries || 0}</p>
                  <p className="text-sm text-gray-600">Completed Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="available"><Clock className="h-4 w-4 mr-2" />Available Orders</TabsTrigger>
            <TabsTrigger value="myorders"><Truck className="h-4 w-4 mr-2" />My Deliveries</TabsTrigger>
            <TabsTrigger value="support"><Headphones className="h-4 w-4 mr-2" />24/7 Support</TabsTrigger>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Orders for Pickup</h2>
              {availableOrders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="font-semibold text-lg mt-2">₹{order.total_amount}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Delivery Address:</p>
                          <p className="text-sm text-gray-600">
                            {order.delivery_address.street}, {order.delivery_address.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className="bg-orange-500 text-white">Ready for Pickup</Badge>
                        <Button
                          onClick={() => assignOrder(order.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Take Order
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="myorders">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">My Delivery Orders</h2>
              {myOrders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="font-semibold text-lg mt-2">₹{order.total_amount}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Delivery Address:</p>
                          <p className="text-sm text-gray-600">
                            {order.delivery_address.street}, {order.delivery_address.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        {order.status === 'out_for_delivery' && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Partner Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{user?.name}</h3>
                      <p className="text-gray-600">Delivery Partner</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{user?.phone}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold">Security</h4>
                      <Button variant="outline" size="sm">Change Password</Button>
                    </div>
                    <p className="text-sm text-gray-600">Keep your account secure by using a strong password</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Session Information */}
            <SessionInfoCard />
          </TabsContent>

          <TabsContent value="support">
            <CustomerCareInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Admin Components
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Delivery Management States
  const [pendingOrders, setPendingOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [availableDeliveryPartners, setAvailableDeliveryPartners] = useState([]);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(false);
  
  // Vendor Verification States
  const [vendors, setVendors] = useState([]);
  const [verifyingVendor, setVerifyingVendor] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  
  // Improved Admin Creation States
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'admin'
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  
  // Vendor Creation States
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    password: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: 'meat_retail',
    address: '',
    city: '',
    state: '',
    latitude: null,
    longitude: null
  });
  const [creatingVendor, setCreatingVendor] = useState(false);
  
  // Delivery Partner Creation States
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [showCreateDeliveryPartner, setShowCreateDeliveryPartner] = useState(false);
  const [newDeliveryPartner, setNewDeliveryPartner] = useState({
    user_id: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    latitude: '',
    longitude: '',
    service_radius_km: 5
  });
  const [creatingDeliveryPartner, setCreatingDeliveryPartner] = useState(false);
  
  // Commission Management States
  const [commissionSettings, setCommissionSettings] = useState(null);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [loadingCommission, setLoadingCommission] = useState(false);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [selectedCommissionRate, setSelectedCommissionRate] = useState(5); // Default 5%
  
  const { user, token, logout } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchOrders();
    fetchProducts();
    fetchDeliveryManagementData();
    fetchCommissionSettings(); // Load commission settings
    fetchCommissionHistory(); // Load commission history
  }, []);

  const fetchStats = async () => {
    try {
      // Add JWT authentication for admin stats
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/dashboard/stats`, { headers });
      setStats(response.data);
    } catch (error) {
      console.error('❌ Admin: Error fetching admin stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Add cache busting and better error handling for admin users
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      console.log('🔄 Admin: Fetching users with cache busting...');
      
      const headers = { 
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      // Add JWT authentication
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/users?_t=${timestamp}&_r=${randomId}`, { headers });
      
      const userData = response.data;
      console.log('✅ Admin: Fetched users successfully:', userData.length);
      
      // Count admin users for debugging
      const adminUsers = userData.filter(user => user.user_type === 'admin');
      console.log('👑 Admin users found:', adminUsers.length);
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email}) - ${admin.user_type}`);
      });
      
      setUsers(userData);
    } catch (error) {
      console.error('❌ Admin: Error fetching users from admin endpoint:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('🔐 Admin authentication/authorization issue');
        }
      }
      
      // Fallback: Try public users endpoint if admin endpoint fails
      try {
        console.log('🔄 Admin: Trying fallback public users endpoint...');
        const timestamp = Date.now();
        const fallbackResponse = await axios.get(`${API}/users?_t=${timestamp}`, {
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        const fallbackData = fallbackResponse.data;
        console.log('✅ Admin: Fallback users fetch successful:', fallbackData.length);
        
        // Count admin users from fallback
        const adminUsers = fallbackData.filter(user => user.user_type === 'admin');
        console.log('👑 Admin users found via fallback:', adminUsers.length);
        
        setUsers(fallbackData);
      } catch (fallbackError) {
        console.error('❌ Admin: Both endpoints failed:', fallbackError);
      }
    }
  };

  // Fetch vendors for verification
  const fetchVendors = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/vendors`, { headers });
      setVendors(response.data.vendors || []);
      console.log('✅ Admin: Vendors fetched successfully:', response.data.vendors?.length);
    } catch (error) {
      console.error('❌ Admin: Error fetching vendors:', error);
    }
  };

  // Verify or unverify vendor
  const verifyVendor = async (vendorId, status, notes = '') => {
    try {
      setVerifyingVendor(true);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${API}/admin/verify-vendor`, {
        vendor_id: vendorId,
        verification_status: status,
        notes: notes
      }, { headers });
      
      console.log('✅ Admin: Vendor verification updated:', response.data);
      fetchVendors(); // Refresh vendors list
      alert(`✅ Vendor ${status ? 'verified' : 'unverified'} successfully!`);
      
    } catch (error) {
      console.error('❌ Admin: Error verifying vendor:', error);
      alert('❌ Failed to update vendor verification status');
    } finally {
      setVerifyingVendor(false);
    }
  };

  // Create new admin with username and password
  const createAdmin = async () => {
    try {
      setCreatingAdmin(true);
      
      // Validation
      if (!newAdmin.username || !newAdmin.password || !newAdmin.name || !newAdmin.email) {
        alert('❌ Please fill all required fields');
        return;
      }
      
      if (newAdmin.password.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
      }
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${API}/admin/create-admin`, newAdmin, { headers });
      
      console.log('✅ Admin: New admin created:', response.data);
      alert(`✅ Admin account created successfully!\nUsername: ${response.data.username}\nEmail: ${response.data.email}`);
      
      // Reset form
      setNewAdmin({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'admin'
      });
      setShowCreateAdmin(false);
      fetchUsers(); // Refresh users list
      
    } catch (error) {
      console.error('❌ Admin: Error creating admin:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to create admin account');
      }
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Create new vendor account
  const createVendor = async () => {
    try {
      setCreatingVendor(true);
      
      // Validation
      if (!newVendor.name || !newVendor.password || !newVendor.email || !newVendor.phone || !newVendor.business_name) {
        alert('❌ Please fill all required fields');
        return;
      }
      
      if (newVendor.password.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
      }
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${API}/admin/create-vendor`, newVendor, { headers });
      
      console.log('✅ Admin: New vendor created:', response.data);
      alert(`✅ Vendor account created successfully!\nName: ${response.data.vendor_name}\nBusiness: ${response.data.business_name}\nEmail: ${response.data.email}`);
      
      // Reset form
      setNewVendor({
        name: '',
        password: '',
        email: '',
        phone: '',
        business_name: '',
        business_type: 'meat_retail',
        address: '',
        city: '',
        state: '',
        latitude: null,
        longitude: null
      });
      setShowCreateVendor(false);
      fetchVendors(); // Refresh vendors list
      
    } catch (error) {
      console.error('❌ Admin: Error creating vendor:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to create vendor account');
      }
    } finally {
      setCreatingVendor(false);
    }
  };

  // Create new delivery partner account
  const createDeliveryPartner = async () => {
    try {
      setCreatingDeliveryPartner(true);
      
      // Validation
      if (!newDeliveryPartner.user_id || !newDeliveryPartner.password || !newDeliveryPartner.name || !newDeliveryPartner.email || !newDeliveryPartner.phone) {
        alert('❌ Please fill all required fields');
        return;
      }
      
      if (newDeliveryPartner.password.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
      }
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${API}/admin/create-delivery-partner`, newDeliveryPartner, { headers });
      
      console.log('✅ Admin: New delivery partner created:', response.data);
      alert(`✅ Delivery Partner account created successfully!\nUser ID: ${response.data.user_id}\nName: ${response.data.name}\nEmail: ${response.data.email}`);
      
      // Reset form
      setNewDeliveryPartner({
        user_id: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        latitude: '',
        longitude: '',
        service_radius_km: 5
      });
      setShowCreateDeliveryPartner(false);
      fetchDeliveryPartners(); // Refresh partners list
      
    } catch (error) {
      console.error('❌ Admin: Error creating delivery partner:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to create delivery partner account');
      }
    } finally {
      setCreatingDeliveryPartner(false);
    }
  };

  // Fetch delivery partners
  const fetchDeliveryPartners = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/delivery-partners`, { headers });
      setDeliveryPartners(response.data.delivery_partners || []);
      console.log('✅ Admin: Delivery partners fetched successfully:', response.data.delivery_partners?.length);
    } catch (error) {
      console.error('❌ Admin: Error fetching delivery partners:', error);
    }
  };

  // Commission Management Functions
  const fetchCommissionSettings = async () => {
    setLoadingCommission(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/commission-settings`, { headers });
      setCommissionSettings(response.data.commission_settings);
      setSelectedCommissionRate(response.data.commission_settings.commission_rate * 100); // Convert to percentage
      console.log('✅ Admin: Commission settings fetched successfully:', response.data);
    } catch (error) {
      console.error('❌ Admin: Error fetching commission settings:', error);
    } finally {
      setLoadingCommission(false);
    }
  };

  const updateCommissionRate = async (newRate) => {
    if (updatingCommission) return;
    
    setUpdatingCommission(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const rateAsDecimal = newRate / 100; // Convert percentage to decimal
      const response = await axios.put(
        `${API}/admin/commission-settings?commission_rate=${rateAsDecimal}`, 
        {}, 
        { headers }
      );
      
      console.log('✅ Admin: Commission rate updated successfully:', response.data);
      alert(`✅ Commission rate updated to ${newRate}%`);
      
      // Refresh settings and history
      await fetchCommissionSettings();
      await fetchCommissionHistory();
      
    } catch (error) {
      console.error('❌ Admin: Error updating commission rate:', error);
      if (error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert('❌ Failed to update commission rate');
      }
    } finally {
      setUpdatingCommission(false);
    }
  };

  const fetchCommissionHistory = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/commission-history`, { headers });
      setCommissionHistory(response.data.commission_history || []);
      console.log('✅ Admin: Commission history fetched successfully:', response.data.commission_history?.length);
    } catch (error) {
      console.error('❌ Admin: Error fetching commission history:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      // Add cache busting and JWT authentication
      const timestamp = Date.now();
      const headers = { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Add JWT authentication
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/orders?_t=${timestamp}`, { headers });
      setOrders(response.data);
    } catch (error) {
      console.error('❌ Admin: Error fetching orders:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Add JWT authentication for admin products
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API}/admin/products/all`, { headers });
      setProducts(response.data);
    } catch (error) {
      console.error('❌ Admin: Error fetching products:', error);
    }
  };

  // Delivery Management Functions
  const fetchDeliveryManagementData = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Fetch delivery management dashboard data
      const dashboardResponse = await axios.get(`${API}/delivery-management/dashboard`, { headers });
      setPendingOrders(dashboardResponse.data.pending_orders || []);
      setAssignedOrders(dashboardResponse.data.assigned_orders || []);

      // Fetch available delivery partners
      const partnersResponse = await axios.get(`${API}/delivery-partners/available`, { headers });
      setAvailableDeliveryPartners(partnersResponse.data.delivery_partners || []);

    } catch (error) {
      console.error('❌ Admin: Error fetching delivery management data:', error);
      // Set empty arrays on error to prevent crashes
      setPendingOrders([]);
      setAssignedOrders([]);
      setAvailableDeliveryPartners([]);
    }
  };

  const assignDeliveryPartner = async (orderId, partnerId) => {
    if (assigningOrder) return;
    
    setAssigningOrder(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await axios.put(`${API}/orders/${orderId}/assign-delivery-partner`, {
        delivery_partner_id: partnerId
      }, { headers });

      // Refresh data after assignment
      await fetchDeliveryManagementData();
      setSelectedOrderForAssignment(null);
      
      alert('✅ Delivery partner assigned successfully!');
    } catch (error) {
      console.error('❌ Admin: Error assigning delivery partner:', error);
      alert('❌ Failed to assign delivery partner. Please try again.');
    } finally {
      setAssigningOrder(false);
    }
  };

  const removeUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
      try {
        console.log('🗑️ Admin: Removing user:', userId);
        
        // Add proper headers with JWT authentication
        const headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        };
        
        // Add JWT token if available
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else {
          alert('❌ Authentication required. Please log in as admin.');
          return;
        }
        
        const response = await axios.delete(`${API}/admin/users/${userId}`, { headers });
        
        console.log('✅ Admin: User removed successfully');
        fetchUsers(); // Refresh the list
        alert('✅ User removed successfully');
      } catch (error) {
        console.error('❌ Admin: Error removing user:', error);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          if (error.response.status === 401) {
            alert('❌ Authentication required. Please log in as admin.');
          } else if (error.response.status === 403) {
            alert('❌ Access denied. Admin privileges required.');
          } else if (error.response.status === 404) {
            alert('❌ User not found or already removed.');
          } else if (error.response.status === 400) {
            alert('❌ Cannot delete yourself or invalid request.');
          } else {
            alert(`❌ Failed to remove user: ${error.response.data?.detail || 'Unknown error'}`);
          }
        } else {
          alert('❌ Failed to remove user: Network error');
        }
      }
    }
  };

  const removeProduct = async (productId) => {
    if (window.confirm('Are you sure you want to remove this product? This action cannot be undone.')) {
      try {
        console.log('🗑️ Admin: Removing product:', productId);
        
        // Add proper headers with JWT authentication
        const headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        };
        
        // Add JWT token if available
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else {
          alert('❌ Authentication required. Please log in as admin.');
          return;
        }
        
        const response = await axios.delete(`${API}/admin/products/${productId}`, { headers });
        
        console.log('✅ Admin: Product removed successfully');
        fetchProducts(); // Refresh the list
        alert('✅ Product removed successfully');
      } catch (error) {
        console.error('❌ Admin: Error removing product:', error);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          if (error.response.status === 401) {
            alert('❌ Authentication required. Please log in as admin.');
          } else if (error.response.status === 403) {
            alert('❌ Access denied. Admin privileges required.');
          } else if (error.response.status === 404) {
            alert('❌ Product not found or already removed.');
          } else {
            alert(`❌ Failed to remove product: ${error.response.data?.detail || 'Unknown error'}`);
          }
        } else {
          alert('❌ Failed to remove product: Network error');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">👑 TimeSafe Admin Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><Home className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="users"><User className="h-4 w-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="vendors"><Store className="h-4 w-4 mr-2" />Vendor Verification</TabsTrigger>
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="maps"><MapPin className="h-4 w-4 mr-2" />Vendor Locations</TabsTrigger>
            <TabsTrigger value="products"><ShoppingCart className="h-4 w-4 mr-2" />Products</TabsTrigger>
            <TabsTrigger value="payment-gateways"><CreditCard className="h-4 w-4 mr-2" />Payment Gateways</TabsTrigger>
            <TabsTrigger value="commission"><CreditCard className="h-4 w-4 mr-2" />Commission</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
            <TabsTrigger value="delivery"><Truck className="h-4 w-4 mr-2" />Delivery Control</TabsTrigger>
            <TabsTrigger value="create-vendor"><Store className="h-4 w-4 mr-2" />Create Vendor</TabsTrigger>
            <TabsTrigger value="create-delivery"><Truck className="h-4 w-4 mr-2" />Create Delivery Partner</TabsTrigger>
            <TabsTrigger value="admins"><UserPlus className="h-4 w-4 mr-2" />Create Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {/* Customer Care Widget */}
            <CustomerCareWidget />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.users?.total || 0}</p>
                      <p className="text-sm text-gray-600">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Package className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.platform?.total_orders || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.platform?.total_products || 0}</p>
                      <p className="text-sm text-gray-600">Total Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">₹{stats.platform?.total_revenue || 0}</p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Type Breakdown */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.users?.customers || 0}</p>
                    <p className="text-sm text-gray-600">Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.users?.vendors || 0}</p>
                    <p className="text-sm text-gray-600">Vendors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.users?.delivery_partners || 0}</p>
                    <p className="text-sm text-gray-600">Delivery Partners</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.users?.admins || 0}</p>
                    <p className="text-sm text-gray-600">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>
                <div className="flex items-center space-x-3">
                  <Badge className="text-sm bg-purple-100 text-purple-800">
                    👑 Admins: {users.filter(u => u.user_type === 'admin').length}
                  </Badge>
                  <Badge className="text-sm">Total: {users.length} users</Badge>
                </div>
              </div>
              
              {users.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    👥
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Users Found</h3>
                  <p className="text-gray-500 mb-4">Users will appear here when they register</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>🔄 Real-time monitoring active</span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {users.map(userData => (
                  <Card key={userData.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{userData.name}</p>
                          <p className="text-sm text-gray-600">{userData.email}</p>
                          <p className="text-sm text-gray-600">{userData.phone}</p>
                          <Badge className={`mt-1 capitalize ${
                            userData.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                            userData.user_type === 'vendor' ? 'bg-green-100 text-green-800' :
                            userData.user_type === 'delivery_partner' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {userData.user_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Joined: {new Date(userData.created_at).toLocaleDateString()}
                          </p>
                          {userData.user_type !== 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mt-2"
                              onClick={() => removeUser(userData.id)}
                            >
                              Remove User
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Order Management</h2>
                <Badge className="text-sm">Total: {orders.length} orders</Badge>
              </div>
              <div className="grid gap-4">
                {orders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">Items: {order.items?.length || 0}</p>
                          <p className="text-sm text-gray-600">Payment: {order.payment_method?.replace('_', ' ') || 'N/A'}</p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">₹{order.total_amount}</p>
                          <Badge className={`capitalize ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Product Management</h2>
                <Badge className="text-sm">Total: {products.length} products</Badge>
              </div>
              <div className="grid gap-4">
                {products.map(product => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-gray-600">Vendor ID: {product.vendor_id}</p>
                          <p className="text-sm text-gray-600">₹{product.price_per_kg}/kg</p>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-2 ${
                            product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          <br />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                          >
                            Remove Product
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delivery">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-green-600">🚚 Your Delivery Management</h2>
                  <p className="text-gray-600">Assign delivery partners to your orders efficiently</p>
                </div>
                <Button 
                  onClick={fetchDeliveryManagementData}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>🔄 Refresh Orders</span>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{pendingOrders.length}</div>
                    <div className="text-sm opacity-90">📦 Need Assignment</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{assignedOrders.length}</div>
                    <div className="text-sm opacity-90">🚛 Out for Delivery</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-400 to-teal-500 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{availableDeliveryPartners.filter(p => p.status === 'available').length}</div>
                    <div className="text-sm opacity-90">👥 Available Partners</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Orders - PRIMARY FOCUS FOR VENDORS */}
                <Card className="ring-2 ring-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-700">
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <span>🎯 YOUR ORDERS - Select Delivery Partner</span>
                      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                        {pendingOrders.length} pending
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-3">
                    {pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-orange-600">
                        <Package className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                        <p className="font-medium">🎉 All orders assigned!</p>
                        <p className="text-sm">No pending assignments right now</p>
                      </div>
                    ) : (
                      pendingOrders.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-600">👤 {order.customer_name}</p>
                              <p className="text-sm text-blue-600">📞 {order.customer_phone}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {order.delivery_address?.address || order.delivery_address?.street || 'Address not provided'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">₹{order.total_amount}</p>
                              <Badge className="bg-yellow-500 text-white text-xs">
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setSelectedOrderForAssignment(order)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
                          >
                            🎯 SELECT DELIVERY PARTNER
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Assigned Orders - MONITORING */}
                <Card className="bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-700">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>📊 Delivery Status Monitor</span>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                        {assignedOrders.length} active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-3">
                    {assignedOrders.length === 0 ? (
                      <div className="text-center py-8 text-blue-600">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                        <p className="font-medium">No active deliveries</p>
                        <p className="text-sm">Orders will appear here once assigned</p>
                      </div>
                    ) : (
                      assignedOrders.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-600">👤 {order.customer_name}</p>
                              <div className="bg-blue-100 rounded-md p-2 mt-2">
                                <p className="text-sm text-blue-700 font-medium">🚚 {order.delivery_partner_name}</p>
                                <p className="text-xs text-blue-600">📞 {order.delivery_partner_phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">₹{order.total_amount}</p>
                              <Badge className="bg-blue-500 text-white text-xs">
                                {order.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            📍 {order.delivery_address?.address || order.delivery_address?.street || 'Address not provided'}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Assignment Dialog */}
              {selectedOrderForAssignment && (
                <Dialog open={!!selectedOrderForAssignment} onOpenChange={() => setSelectedOrderForAssignment(null)}>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-orange-700">
                        🎯 Select Best Delivery Partner
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                        <p className="font-semibold text-gray-800">📦 Order #{selectedOrderForAssignment.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">👤 Customer: {selectedOrderForAssignment.customer_name}</p>
                        <p className="text-sm text-blue-600">📞 {selectedOrderForAssignment.customer_phone}</p>
                        <p className="text-lg font-bold text-green-600">💰 ₹{selectedOrderForAssignment.total_amount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {selectedOrderForAssignment.delivery_address?.address || 'Address provided'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Available Delivery Partners:</label>
                          <Badge variant="outline" className="text-xs">
                            {availableDeliveryPartners.filter(p => p.status === 'available').length} available
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {availableDeliveryPartners.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <p className="text-sm">No delivery partners available</p>
                              <p className="text-xs">Please try again later</p>
                            </div>
                          ) : (
                            availableDeliveryPartners.map(partner => (
                              <div
                                key={partner.id}
                                onClick={() => !assigningOrder && assignDeliveryPartner(selectedOrderForAssignment.id, partner.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                  assigningOrder ? 'opacity-50 cursor-not-allowed' : 
                                  partner.status === 'available' ? 
                                  'hover:bg-green-50 hover:border-green-300 hover:shadow-md transform hover:-translate-y-1' : 
                                  'bg-red-50 border-red-200 opacity-75'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">🚚 {partner.name}</p>
                                    <p className="text-sm text-blue-600">📞 {partner.phone}</p>
                                    {partner.distance_km !== undefined && (
                                      <p className="text-xs text-purple-600">📍 {partner.distance_km} km away</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge className={`text-xs ${partner.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`}>
                                      {partner.status === 'available' ? '✅ Available' : '🔴 Busy'}
                                    </Badge>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {partner.active_deliveries} active deliveries
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {assigningOrder && (
                        <div className="flex items-center justify-center space-x-3 py-4 bg-blue-50 rounded-lg">
                          <div className="spinner border-blue-600"></div>
                          <span className="text-blue-700 font-medium">🎯 Assigning delivery partner...</span>
                        </div>
                      )}
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                          💡 <strong>Tip:</strong> Choose partners with fewer active deliveries for faster delivery. 
                          Closer partners will reach customers quicker!
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🏪 Vendor Verification</h2>
                  <p className="text-gray-600">Verify and manage vendor accounts</p>
                </div>
                <Button onClick={fetchVendors} className="bg-blue-600 hover:bg-blue-700">
                  <Store className="h-4 w-4 mr-2" />
                  Refresh Vendors
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                  <Card key={vendor.id} className={`relative ${vendor.is_verified ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{vendor.name}</span>
                        {vendor.is_verified ? (
                          <Badge className="bg-green-500 text-white">✅ Verified</Badge>
                        ) : (
                          <Badge className="bg-orange-500 text-white">⏳ Pending</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{vendor.business_name}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p><strong>Email:</strong> {vendor.email}</p>
                        <p><strong>Phone:</strong> {vendor.phone}</p>
                        <p><strong>Business Type:</strong> {vendor.business_type || 'Not specified'}</p>
                        <p><strong>Joined:</strong> {new Date(vendor.created_at).toLocaleDateString()}</p>
                        {vendor.verification_date && (
                          <p><strong>Verified:</strong> {new Date(vendor.verification_date).toLocaleDateString()}</p>
                        )}
                        {vendor.verified_by && (
                          <p><strong>Verified by:</strong> {vendor.verified_by}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {!vendor.is_verified ? (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => verifyVendor(vendor.id, true, 'Verified by admin')}
                            disabled={verifyingVendor}
                          >
                            ✅ Verify
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50"
                            onClick={() => verifyVendor(vendor.id, false, 'Verification revoked')}
                            disabled={verifyingVendor}
                          >
                            ❌ Revoke
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {vendors.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No vendors found</h3>
                    <p className="text-gray-500">Click "Refresh Vendors" to load vendor data</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commission">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-green-600">💰 Commission Management</h2>
                  <p className="text-gray-600">Manage platform commission rates for all orders</p>
                </div>
                <Button 
                  onClick={() => {
                    fetchCommissionSettings();
                    fetchCommissionHistory();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={loadingCommission}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>🔄 Refresh Data</span>
                </Button>
              </div>

              {/* Current Commission Settings */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <CreditCard className="h-5 w-5" />
                    <span>Current Commission Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCommission ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading commission settings...</p>
                    </div>
                  ) : commissionSettings ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-200">
                        <div>
                          <p className="text-3xl font-bold text-green-600">
                            {(commissionSettings.commission_rate * 100).toFixed(0)}%
                          </p>
                          <p className="text-sm text-gray-600">Current Rate</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Updated by:</p>
                          <p className="font-semibold">{commissionSettings.updated_by}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(commissionSettings.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Update Commission Rate:</h4>
                        <div className="grid grid-cols-5 gap-3">
                          {[1, 2, 3, 5, 10].map(rate => (
                            <Button
                              key={rate}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to change commission rate to ${rate}%?`)) {
                                  updateCommissionRate(rate);
                                }
                              }}
                              disabled={updatingCommission || (commissionSettings.commission_rate * 100 === rate)}
                              className={`${
                                commissionSettings.commission_rate * 100 === rate
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              }`}
                            >
                              {updatingCommission ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                `${rate}%`
                              )}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Click on any percentage to set it as the new commission rate for all future orders
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-600">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Failed to load commission settings</p>
                      <Button onClick={fetchCommissionSettings} size="sm" className="mt-2">
                        Retry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Commission History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <History className="h-5 w-5" />
                    <span>Commission History</span>
                    <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                      {commissionHistory.length} changes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {commissionHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No commission history available</p>
                      <p className="text-sm">Commission changes will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commissionHistory.map((record, index) => (
                        <div key={record.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <p className="font-semibold text-lg">
                                {record.commission_percentage}
                              </p>
                              <p className="text-sm text-gray-600">
                                Updated by: {record.updated_by}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(record.updated_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(record.updated_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Commission Impact Calculator */}
              <Card className="bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-700">
                    <span>📊</span>
                    <span>Commission Impact Calculator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[100, 500, 1000].map(amount => {
                      const currentRate = commissionSettings ? commissionSettings.commission_rate : 0.05;
                      const commission = Math.round(amount * currentRate);
                      const vendorEarnings = amount - commission;
                      
                      return (
                        <div key={amount} className="p-3 bg-white rounded-lg border">
                          <p className="font-semibold text-center text-lg">₹{amount} Order</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Platform:</span>
                              <span className="font-semibold text-red-600">₹{commission}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vendor:</span>
                              <span className="font-semibold text-green-600">₹{vendorEarnings}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Shows how current commission rate affects different order amounts
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create-vendor">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🏪 Create Vendor Account</h2>
                  <p className="text-gray-600">Generate vendor accounts with name and password</p>
                </div>
              </div>

              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2" />
                    New Vendor Account
                  </CardTitle>
                  <p className="text-sm text-gray-600">Create a new vendor account with business details</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vendorName">Vendor Name *</Label>
                      <Input
                        id="vendorName"
                        type="text"
                        placeholder="John Smith"
                        value={newVendor.name}
                        onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vendorEmail">Email Address *</Label>
                      <Input
                        id="vendorEmail"
                        type="email"
                        placeholder="vendor@timesafe.in"
                        value={newVendor.email}
                        onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vendorPhone">Phone Number *</Label>
                      <Input
                        id="vendorPhone"
                        type="tel"
                        placeholder="9876543210"
                        value={newVendor.phone}
                        onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vendorPassword">Password *</Label>
                      <Input
                        id="vendorPassword"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newVendor.password}
                        onChange={(e) => setNewVendor({...newVendor, password: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Delhi Fresh Mutton"
                        value={newVendor.business_name}
                        onChange={(e) => setNewVendor({...newVendor, business_name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select value={newVendor.business_type} onValueChange={(value) => setNewVendor({...newVendor, business_type: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meat_retail">Meat Retail</SelectItem>
                          <SelectItem value="halal_meat">Halal Meat</SelectItem>
                          <SelectItem value="organic_meat">Organic Meat</SelectItem>
                          <SelectItem value="wholesale">Wholesale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-base font-medium text-gray-800">📍 Business Address</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              async (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                
                                try {
                                  const response = await axios.post(`${API}/customer/geocode-address?latitude=${lat}&longitude=${lng}`);
                                  
                                  if (response.data.success) {
                                    setNewVendor({
                                      ...newVendor,
                                      address: response.data.formatted_address,
                                      city: response.data.city || newVendor.city,
                                      state: response.data.state || newVendor.state,
                                      latitude: response.data.latitude,
                                      longitude: response.data.longitude
                                    });
                                    alert('Current location set successfully!');
                                  } else {
                                    alert('Unable to get detailed address. Please enter manually.');
                                  }
                                } catch (error) {
                                  console.error('Geocoding error:', error);
                                  alert('Error getting address details. Please enter manually.');
                                }
                              },
                              (error) => {
                                console.error('Geolocation error:', error);
                                alert('Unable to get your current location. Please enter manually.');
                              }
                            );
                          } else {
                            alert('Geolocation is not supported by this browser.');
                          }
                        }}
                        className="text-xs"
                      >
                        📍 Use Current Location
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="vendorAddress">Complete Address</Label>
                        <Textarea
                          id="vendorAddress"
                          placeholder="Shop/Building number, Street, Area, Landmark"
                          value={newVendor.address}
                          onChange={(e) => setNewVendor({...newVendor, address: e.target.value})}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vendorCity">City</Label>
                          <Input
                            id="vendorCity"
                            type="text"
                            placeholder="City name"
                            value={newVendor.city}
                            onChange={(e) => setNewVendor({...newVendor, city: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="vendorState">State</Label>
                          <Input
                            id="vendorState"
                            type="text"
                            placeholder="State name"
                            value={newVendor.state}
                            onChange={(e) => setNewVendor({...newVendor, state: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      {newVendor.latitude && newVendor.longitude && (
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          ✅ GPS Location: {newVendor.latitude.toFixed(4)}, {newVendor.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">🏪 Vendor Benefits</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Manage products and inventory</li>
                      <li>• Receive and process orders</li>
                      <li>• Track sales and earnings</li>
                      <li>• Set business hours and availability</li>
                      <li>• Auto-verified by admin</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={createVendor}
                      disabled={creatingVendor}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {creatingVendor ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Store className="h-4 w-4 mr-2" />
                          Create Vendor Account
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setNewVendor({
                          name: '',
                          password: '',
                          email: '',
                          phone: '',
                          business_name: '',
                          business_type: 'meat_retail'
                        });
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create-delivery">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🚚 Create Delivery Partner</h2>
                  <p className="text-gray-600">Generate delivery partner accounts with user ID and password</p>
                </div>
                <Button onClick={fetchDeliveryPartners} className="bg-blue-600 hover:bg-blue-700">
                  <Truck className="h-4 w-4 mr-2" />
                  View All Partners
                </Button>
              </div>

              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    New Delivery Partner
                  </CardTitle>
                  <p className="text-sm text-gray-600">Create a new delivery partner account with service details</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partnerUserId">User ID *</Label>
                      <Input
                        id="partnerUserId"
                        type="text"
                        placeholder="delivery123"
                        value={newDeliveryPartner.user_id}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, user_id: e.target.value})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Unique ID for login</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="partnerName">Full Name *</Label>
                      <Input
                        id="partnerName"
                        type="text"
                        placeholder="Raj Kumar"
                        value={newDeliveryPartner.name}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partnerEmail">Email Address *</Label>
                      <Input
                        id="partnerEmail"
                        type="email"
                        placeholder="delivery@timesafe.in"
                        value={newDeliveryPartner.email}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, email: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="partnerPhone">Phone Number *</Label>
                      <Input
                        id="partnerPhone"
                        type="tel"
                        placeholder="9876543210"
                        value={newDeliveryPartner.phone}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, phone: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partnerPassword">Password *</Label>
                      <Input
                        id="partnerPassword"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newDeliveryPartner.password}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, password: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="serviceRadius">Service Radius (km)</Label>
                      <Select value={newDeliveryPartner.service_radius_km.toString()} onValueChange={(value) => setNewDeliveryPartner({...newDeliveryPartner, service_radius_km: parseInt(value)})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select radius" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 km radius</SelectItem>
                          <SelectItem value="5">5 km radius</SelectItem>
                          <SelectItem value="8">8 km radius</SelectItem>
                          <SelectItem value="10">10 km radius</SelectItem>
                          <SelectItem value="15">15 km radius</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partnerLatitude">Latitude (Optional)</Label>
                      <Input
                        id="partnerLatitude"
                        type="number"
                        step="any"
                        placeholder="28.6139"
                        value={newDeliveryPartner.latitude}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, latitude: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="partnerLongitude">Longitude (Optional)</Label>
                      <Input
                        id="partnerLongitude"
                        type="number"
                        step="any"
                        placeholder="77.2090"
                        value={newDeliveryPartner.longitude}
                        onChange={(e) => setNewDeliveryPartner({...newDeliveryPartner, longitude: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">🚚 Delivery Partner Benefits</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Receive nearby delivery orders</li>
                      <li>• Track earnings and commissions</li>
                      <li>• GPS-based order assignment</li>
                      <li>• Real-time order notifications</li>
                      <li>• Auto-verified by admin</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={createDeliveryPartner}
                      disabled={creatingDeliveryPartner}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creatingDeliveryPartner ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2" />
                          Create Delivery Partner
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setNewDeliveryPartner({
                          user_id: '',
                          password: '',
                          name: '',
                          email: '',
                          phone: '',
                          latitude: '',
                          longitude: '',
                          service_radius_km: 5
                        });
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Show existing delivery partners if any */}
              {deliveryPartners.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Existing Delivery Partners ({deliveryPartners.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deliveryPartners.map((partner) => (
                      <Card key={partner.id} className="border-blue-200 bg-blue-50">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{partner.name}</span>
                            <Badge className="bg-blue-500 text-white">📍 {partner.service_radius_km}km</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs space-y-1">
                            <p><strong>User ID:</strong> {partner.user_id}</p>
                            <p><strong>Email:</strong> {partner.email}</p>
                            <p><strong>Phone:</strong> {partner.phone}</p>
                            {partner.created_by && (
                              <p><strong>Created by:</strong> {partner.created_by}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">👑 Create Admin Account</h2>
                  <p className="text-gray-600">Create new admin accounts with username and password</p>
                </div>
              </div>

              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>New Admin Account</CardTitle>
                  <p className="text-sm text-gray-600">Fill in the details to create a new admin account</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="admin123"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Unique username for login</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="adminName">Full Name *</Label>
                      <Input
                        id="adminName"
                        type="text"
                        placeholder="John Smith"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminEmail">Email Address *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@timesafe.in"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="adminPassword">Password *</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="adminRole">Role</Label>
                    <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({...newAdmin, role: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">👑 Admin Privileges</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Manage users, vendors, and delivery partners</li>
                      <li>• Verify vendor accounts</li>
                      <li>• View all orders and analytics</li>
                      <li>• Create other admin accounts</li>
                      <li>• Full system access</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={createAdmin}
                      disabled={creatingAdmin}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {creatingAdmin ? (
                        <>
                          <div className="spinner mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Admin Account
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setNewAdmin({
                          username: '',
                          password: '',
                          name: '',
                          email: '',
                          role: 'admin'
                        });
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send New Notification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>📢 Send Notification</span>
                  </CardTitle>
                  <CardDescription>
                    Send notifications to customers, vendors, delivery partners, or all users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notifTitle">Notification Title *</Label>
                    <Input
                      id="notifTitle"
                      placeholder="e.g., Good Morning Special Offer!"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notifMessage">Message *</Label>
                    <Textarea
                      id="notifMessage"
                      placeholder="e.g., Get 20% off on fresh mutton today! Limited time offer."
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="notifType">Notification Type</Label>
                      <Select 
                        value={newNotification.notification_type} 
                        onValueChange={(value) => setNewNotification({...newNotification, notification_type: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="promotional">🎉 Promotional</SelectItem>
                          <SelectItem value="offer">💰 Special Offer</SelectItem>
                          <SelectItem value="system">⚙️ System Update</SelectItem>
                          <SelectItem value="order">📦 Order Related</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notifTarget">Target Users</Label>
                      <Select 
                        value={newNotification.target_users} 
                        onValueChange={(value) => setNewNotification({...newNotification, target_users: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">👥 All Users</SelectItem>
                          <SelectItem value="customers">🛒 Customers Only</SelectItem>
                          <SelectItem value="vendors">🏪 Vendors Only</SelectItem>
                          <SelectItem value="delivery">🚚 Delivery Partners</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-sm font-medium">📱 Delivery Options</Label>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendSMS"
                        checked={newNotification.send_sms}
                        onChange={(e) => setNewNotification({...newNotification, send_sms: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="sendSMS" className="text-sm cursor-pointer">
                        📲 Send SMS (using Twilio)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sendPush"
                        checked={newNotification.send_push}
                        onChange={(e) => setNewNotification({...newNotification, send_push: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="sendPush" className="text-sm cursor-pointer">
                        🔔 In-App Notification
                      </Label>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 text-sm mb-2">💡 Quick Templates</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewNotification({
                          ...newNotification,
                          title: "🌅 Good Morning Special!",
                          message: "Start your day with fresh mutton! Get 15% off on all orders placed before 12 PM today.",
                          notification_type: "offer",
                          target_users: "customers"
                        })}
                        className="w-full text-xs"
                      >
                        Good Morning Offer Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewNotification({
                          ...newNotification,
                          title: "📦 New Order Alert!",
                          message: "You have received a new order. Please check your dashboard and accept it promptly.",
                          notification_type: "order",
                          target_users: "vendors"
                        })}
                        className="w-full text-xs"
                      >
                        New Order Alert Template
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={sendNotification}
                    disabled={loadingNotifications || !newNotification.title || !newNotification.message}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loadingNotifications ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Notification History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>📋 Notification History</span>
                  </CardTitle>
                  <CardDescription>
                    View previously sent notifications and their delivery status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {notificationHistory.length > 0 ? (
                      notificationHistory.map((notif) => (
                        <div key={notif.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{notif.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              notif.status === 'sent' ? 'bg-green-100 text-green-800' :
                              notif.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              notif.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notif.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{notif.message}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>
                              Target: {notif.target_users} | 
                              Type: {notif.notification_type} |
                              Sent to: {notif.sent_to_count} users
                            </span>
                            <span>
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex space-x-2 mt-1">
                            {notif.send_sms && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📲 SMS</span>
                            )}
                            {notif.send_push && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🔔 Push</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications sent yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, allowedUserTypes }) => {
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
    if (allowedUserTypes && !allowedUserTypes.includes(user.user_type)) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  // Route mapping function
  const getUserRoute = (userType) => {
    const routeMap = {
      'customer': '/customer',
      'vendor': '/vendor',
      'delivery_partner': '/delivery',
      'admin': '/admin'
    };
    return routeMap[userType] || '/auth';
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={!user ? <OTPAuthPage /> : <Navigate to={getUserRoute(user.user_type)} replace />} 
        />
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute allowedUserTypes={['customer']}>
              <CustomerDashboard />
              <CustomerCareWidget position="floating" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendor" 
          element={
            <ProtectedRoute allowedUserTypes={['vendor']}>
              <VendorDashboard />
              <CustomerCareWidget position="floating" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/delivery" 
          element={
            <ProtectedRoute allowedUserTypes={['delivery_partner']}>
              <DeliveryDashboard />
              <CustomerCareWidget position="floating" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <AdminDashboard />
              <CustomerCareWidget position="floating" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            user ? <Navigate to={getUserRoute(user.user_type)} replace /> : <Navigate to="/auth" replace />
          } 
        />
      </Routes>
      
      {/* 🤖 Smart ChatBot - Available on All Pages */}
      <ChatBot />
    </Router>
  );
};

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}