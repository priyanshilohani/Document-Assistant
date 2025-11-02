"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// Define a custom type for decoded JWT
interface DecodedToken {
  user_id: string;
  username: string;
  exp: number;
}

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [username, setUsername] = useState("User");
  const [userImage] = useState("/users.png"); // Default image
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode<DecodedToken>(token);
      setUsername(decoded.username || "User");
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      Cookies.remove("token");
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    Cookies.remove("token");
    setIsLogoutModalOpen(false);
    router.push("/login");
  };


  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <Link href="/">DocAssist</Link>
          </div>
          <div className="menu">
            <div className="user-profile">
              <div className="profile-icon" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <Image src={userImage} alt="User Profile" width={40} height={40} />
              </div>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <p className="dropdown-item">
                     {username}</p>
                  <hr />
                  <Link href="/settings" className="dropdown-item">⚙️ Settings</Link>
                  <button onClick={handleLogout} className="dropdown-item logout">🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
          <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h1>Welcome to DocAssist</h1>
        <p>Simplify your note-taking and document management with our all-in-one platform.</p>
        <div className="hero-buttons">
          <Link href="#features" className="button">Explore Features</Link>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons">
              <button onClick={confirmLogout} className="confirm-btn">Yes</button>
              <button onClick={() => setIsLogoutModalOpen(false)} className="cancel-btn">No</button>
            </div>
          </div>
        </div>
      )}

      {/* About Us Section */}
      <section id="about-us" className="about-us">
        <h2>About DocAssist</h2>
        <p>Designed as part of a final year project, DocAssist integrates cutting-edge AI to provide an intuitive and seamless user experience.</p>
      </section>


      {/* Features Section */}
            <section id="features" className="features">
              <h2>Features</h2>
              <div className="feature">
                <div className="feature-image">
                  <div className="image-placeholder">
                    <Image 
                    className='img-feature'
                      src="/featueimg1.svg" 
                      alt="AI Text Editor" 
                      width={500} 
                      height={300} 
                    />
                  </div>
                </div>
                <div className="feature-content">
                  <h3>
                    <Link href="/text-editor">AI-Powered Text Editor</Link>
                  </h3>
                  <p>
                    Enhance your writing experience with advanced editing tools and AI-powered suggestions.
                  </p>
                </div>
              </div>
      
              <div className="feature reverse">
                <div className="feature-content">
                  <h3>
                    <Link href="/docbot">DocBot Assistant</Link>
                  </h3>
                  <p>
                    Find documents, organize thoughts, and let AI simplify your workflow.
                  </p>
                </div>
                <div className="feature-image">
                  <div className="image-placeholder">
                    <Image className='img-feature'
                      src="/docbot-feature-img.svg" 
                      alt="DocBot Assistant" 
                      width={500} 
                      height={300} 
                    />
                  </div>
                </div>
              </div>
      
              <div className="feature reverse">
                <div className="feature-content">
                  <h3>
                    <Link href="/paraphrase">Paraphraser</Link>
                  </h3>
                  <p>
                    Easily rephrase and refine your text for clarity and originality.
                  </p>
                </div>
                <div className="feature-image">
                  <div className="image-placeholder">
                    <Image className='img-feature'
                      src="/writer.png" 
                      alt="AI Paraphraser" 
                      width={500} 
                      height={300} 
                    />
                  </div>
                </div>
              </div>
      
              <div className="feature reverse">
                <div className="feature-content">
                  <h3>
                    <Link href="/ocr">OCR Text Extraction</Link>
                  </h3>
                  <p>
                    Extract text from images easily with our Optical Character Recognition (OCR) tool.
                  </p>
                </div>
                <div className="feature-image">
                  <div className="image-placeholder">
                    <Image className="img-feature"
                      src="/phone.png" 
                      alt="OCR Feature" 
                      width={500} 
                      height={300} 
                    />
                  </div>
                </div>
              </div>
      
              <div className="feature">
                <div className="feature-image">
                  <div className="image-placeholder">
                    <Image  className='img-feature'
                      src="/storage-img.svg" 
                      alt="Notes Drive" 
                      width={500} 
                      height={300} 
                    />
                  </div>
                </div>
                <div className="feature-content">
                  <h3>
                    <Link href="/storage">Notes Drive</Link>
                  </h3>
                  <p>
                    Safely store and access your notes anywhere, anytime.
                  </p>
                </div>
              </div>
      
              <div className="feature">
                <div className="feature-image">
                  <div className="image-placeholder">
                    <Image className='img-feature' src="/web-design.png" alt="Research Paper Templates" width={500} height={500} />
                  </div>
                </div>
                <div className="feature-content">
                  <h3><Link href="/template">Research Paper Templates</Link></h3>
                  <p>Select and edit research paper templates tailored to various journals.</p>
                </div>
              </div>
            </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} DocAssist. All rights reserved.</p>
      </footer>

      <style jsx>{`
        /* Dropdown menu styling */
        .dropdown-menu {
          position: absolute;
          top: 50px;
          right: 10px;
          background: #161B22;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
          padding: 10px;
          width: 180px;
          z-index: 1000;
        }
        
        .dropdown-item {
          display: block;
          padding: 10px;
          color: white;
          text-decoration: none;
          transition: background 0.3s;
        }

        .dropdown-item:hover {
          background:rgb(151, 190, 222);
        }

        .logout {
          margin-top: 8px; /* Adds gap between Settings and Logout */
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          color: red;
          font-weight: bold;
        }

        /* Modal overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        /* Modal box */
        .modal {
          background: #161B22;
          padding: 20px;
          border-radius: 10px;
          width: 320px;
          text-align: center;
          box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
        }

        .modal-buttons {
          margin-top: 15px;
          display: flex;
          justify-content: space-evenly;
        }

        .confirm-btn {
          background: red;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
        }

        .cancel-btn {
          background: grey;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
        }

        .confirm-btn:hover {
          background: darkred;
        }

        .cancel-btn:hover {
          background: darkgrey;
        }
      `}</style>
    </div>


  );
};

export default Home;