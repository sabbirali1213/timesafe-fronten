import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      message: 'नमस्ते! मैं TimeSafe का Assistant हूँ। आप क्या जानना चाहते हैं? 🤖',
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🤖 Smart Auto-Response System
  const getAutoResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    // Hindi/English mixed responses for better user experience
    const responses = {
      // Order Related
      order: [
        "📦 Order Status: अपना order track करने के लिए 'My Orders' section में जाएं। Order ID डालकर real-time status देख सकते हैं।",
        "⏰ Delivery Time: हमारी standard delivery time 30 minutes है। Traffic के अनुसार 20-45 minutes लग सकते हैं।",
        "📍 Order Tracking: आपका order live track हो रहा है। Delivery partner का contact number SMS में मिल जाएगा।"
      ],
      
      // Product Related  
      product: [
        "🥩 Products: हमारे पास fresh mutton, chicken, fish और ready-to-cook items हैं। सभी products premium quality के हैं।",
        "💰 Pricing: Best prices guarantee! 250g, 500g, 1kg options available हैं। Bulk order पर extra discount मिलता है।",
        "✅ Quality: 100% fresh, hygienic cuts। Same day sourcing से direct आपके घर पहुंचता है।"
      ],
      
      // Delivery Related
      delivery: [
        "🚚 Delivery Areas: हम सभी nearby areas में deliver करते हैं। Pin code डालकर availability check कर सकते हैं।",
        "🕐 Delivery Timing: Morning 6 AM से Night 11 PM तक। Sunday भी available हैं।",
        "📞 Contact Delivery: Order confirm होने के बाद delivery partner का number मिल जाएगा।"
      ],
      
      // Payment Related
      payment: [
        "💳 Payment Options: Cash on Delivery (COD), UPI, Credit/Debit Cards सभी accept करते हैं।",
        "🔒 Secure Payment: 100% secure payment gateway। आपकी details safe रहती हैं।",
        "💰 Refund Policy: किसी भी problem के case में full refund guarantee है।"
      ],
      
      // Account Related
      account: [
        "👤 Account: OTP से login करें। Phone number verify होने के बाद account ready हो जाता है।",
        "📱 Profile: My Profile section में अपनी details update कर सकते हैं।",
        "🏠 Address: Multiple addresses save कर सकते हैं delivery के लिए।"
      ],
      
      // Vendor Related
      vendor: [
        "🏪 Vendor Registration: Vendor बनने के लिए registration form भरें। Admin approval के बाद account activate होगा।",
        "📈 Vendor Dashboard: Products add/edit करें, orders manage करें, earnings track करें।",
        "💼 Commission: Competitive commission rates। Monthly payout guaranteed है।"
      ],
      
      // General Help
      help: [
        "❓ Help Options:\n1️⃣ Order tracking\n2️⃣ Product info\n3️⃣ Delivery status\n4️⃣ Payment help\n5️⃣ Account issues\n\nकोई भी number type करें!",
        "📞 Contact Us: \n📧 Email: support@timesafe.in\n📱 WhatsApp: +91-9876543210\n🕐 Available: 24/7",
        "🆘 Emergency: अगर urgent help चाहिए तो direct call करें: +91-9876543210"
      ],
      
      // Greetings
      greeting: [
        "नमस्ते! TimeSafe में आपका स्वागत है! 🙏 Fresh mutton 30 minutes में deliver करते हैं। कैसे help कर सकता हूँ?",
        "Hello! Welcome to TimeSafe Delivery! 😊 आज क्या order करना चाहेंगे?",
        "Hi there! 👋 Fresh meat delivery के लिए आप right place पर हैं। कुछ पूछना है?"
      ],
      
      // Complaints/Issues
      complaint: [
        "😔 Sorry for the inconvenience! आपकी complaint को seriously लेते हैं। Details बताएं - तुरंत resolve करेंगे।",
        "🔧 Issue Resolution: Management को forward कर रहा हूँ। 10 minutes में callback आएगा।",
        "📝 Feedback: आपका feedback valuable है। Please share details - improvement के लिए जरूरी है।"
      ]
    };

    // Smart keyword detection with multiple languages
    if (msg.includes('order') || msg.includes('ऑर्डर') || msg.includes('आर्डर') || msg.includes('track') || msg.includes('status')) {
      return responses.order[Math.floor(Math.random() * responses.order.length)];
    }
    
    if (msg.includes('product') || msg.includes('mutton') || msg.includes('chicken') || msg.includes('meat') || msg.includes('मटन') || msg.includes('चिकन') || msg.includes('मांस') || msg.includes('price') || msg.includes('दाम') || msg.includes('rate')) {
      return responses.product[Math.floor(Math.random() * responses.product.length)];
    }
    
    if (msg.includes('delivery') || msg.includes('डिलीवरी') || msg.includes('deliver') || msg.includes('time') || msg.includes('कितना') || msg.includes('समय') || msg.includes('area') || msg.includes('location')) {
      return responses.delivery[Math.floor(Math.random() * responses.delivery.length)];
    }
    
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('पेमेंट') || msg.includes('भुगतान') || msg.includes('paisa') || msg.includes('पैसा') || msg.includes('refund') || msg.includes('वापसी')) {
      return responses.payment[Math.floor(Math.random() * responses.payment.length)];
    }
    
    if (msg.includes('account') || msg.includes('profile') || msg.includes('login') || msg.includes('register') || msg.includes('अकाउंट') || msg.includes('लॉगिन') || msg.includes('साइन')) {
      return responses.account[Math.floor(Math.random() * responses.account.length)];
    }
    
    if (msg.includes('vendor') || msg.includes('sell') || msg.includes('business') || msg.includes('वेंडर') || msg.includes('बेचना') || msg.includes('व्यापार') || msg.includes('shop')) {
      return responses.vendor[Math.floor(Math.random() * responses.vendor.length)];
    }
    
    if (msg.includes('help') || msg.includes('हेल्प') || msg.includes('सहायता') || msg.includes('madad') || msg.includes('मदद') || msg.includes('support')) {
      return responses.help[Math.floor(Math.random() * responses.help.length)];
    }
    
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('नमस्ते') || msg.includes('namaste') || msg.includes('hii') || msg.includes('hey')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
    
    if (msg.includes('problem') || msg.includes('issue') || msg.includes('complaint') || msg.includes('समस्या') || msg.includes('परेशानी') || msg.includes('गलत') || msg.includes('wrong') || msg.includes('bad')) {
      return responses.complaint[Math.floor(Math.random() * responses.complaint.length)];
    }
    
    // Number selection for help menu
    if (msg === '1') return "📦 Order Tracking: My Orders section में जाकर Order ID डालें। Real-time location और ETA देख सकते हैं।";
    if (msg === '2') return "🥩 Product Info: Fresh mutton (₹450/kg), Chicken (₹320/kg), Fish (₹280/kg)। सभी items ready-to-cook भी available हैं।";
    if (msg === '3') return "🚚 Delivery Status: Standard delivery 30 min। Express delivery 20 min (extra ₹50)। Live tracking available।";
    if (msg === '4') return "💳 Payment Help: COD, UPI, Cards accept। Failed payment auto-refund। Issues के लिए: support@timesafe.in";
    if (msg === '5') return "👤 Account Issues: OTP not received? Call +91-9876543210। Login problems? Clear browser cache।";
    
    // Default intelligent response
    return `🤔 समझ नहीं आया। लेकिन मैं यह help कर सकता हूँ:\n\n🥩 Products & Pricing\n📦 Order Tracking\n🚚 Delivery Info\n💳 Payment Help\n👤 Account Support\n\nकोई specific question है? Detail में पूछें! 😊`;
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const userMessage = {
      type: 'user',
      message: inputMessage,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay for natural feel
    setTimeout(() => {
      const botResponse = {
        type: 'bot',
        message: getAutoResponse(inputMessage),
        time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    handleSendMessage();
  };

  const quickReplies = [
    "Order status?",
    "Delivery time?", 
    "मटन का rate?",
    "Payment options?",
    "Help needed"
  ];

  return (
    <>
      {/* Chat Button */}
      <div 
        className={`chat-button ${isOpen ? 'chat-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <span style={{ fontSize: '20px' }}>✕</span>
        ) : (
          <>
            <span style={{ fontSize: '20px' }}>💬</span>
            <div className="chat-notification">
              <span>Help?</span>
            </div>
          </>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🤖</div>
              <div>
                <div className="chat-title">TimeSafe Assistant</div>
                <div className="chat-status">🟢 हमेशा Available</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chat-close">✕</button>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-content">
                  <div className="message-text">{msg.message}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="quick-replies">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                className="quick-reply-btn"
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="यहाँ type करें... 💬"
              className="chat-input"
            />
            <button onClick={handleSendMessage} className="chat-send-btn">
              📤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;