'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <Link className="logotext" href="/">DocAssist</Link>
          </div>
          <div className="menu">
            <Link href="/login" className="button contrast">Sign In</Link>
            <Link href="/signup" className="signup-button contrast">Sign Up</Link>
          </div>
          <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h1>Welcome to DocAssist</h1>
        <p>
          Simplify your note-taking and document management with our all-in-one platform.
          Powered by AI, DocAssist enhances productivity, efficiency, and organization.
        </p>
        <div className="hero-buttons">
          <Link href="#features" className="button">
            Explore Features
          </Link>
        </div>
      </header>

      {/* About Us Section */}
      <section id="about-us" className="about-us">
        <h2>About DocAssist</h2>
        <p>
          Designed as part of a final year project, DocAssist integrates cutting-edge AI to
          provide an intuitive and seamless user experience. From writing smarter to managing
          notes, its the perfect tool for students and professionals alike.
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="features">

        <h2>Features</h2>

        <div className="feature">
          <div className="feature-image">
            <div className="image-placeholder">
              <Image
                className='img-feature-png'
                src="/translate.png"
                alt="Multi-Lingual Translator"
                width={500}
                height={300}
              />

            </div>
          </div>
          <div className="feature-content">
            <h3>
              <Link href="/translate">Multi-Lingual Translator</Link>
            </h3>
            <p>
              Instantly translate your texts into multiple languages with our AI-powered Multilingual Translator.
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

        <div className="feature">
          <div className="feature-image">
            <div className="image-placeholder">
              <Image className='img-feature-png' src="/terms.png" alt="Research Paper Templates" width={500} height={500} />
            </div>
          </div>
          <div className="feature-content">
            <h3><Link href="/template">Research Paper Templates</Link></h3>
            <p>Select and edit research paper templates tailored to various journals.</p>
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
              <Image className='img-feature-png'
                src="/writer.png"
                alt="AI Paraphraser"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>


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

        <div className="feature">
          <div className="feature-image">
            <div className="image-placeholder">
              <Image className='img-feature'
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
              <Image className="img-feature-png"
                src="/phone.png"
                alt="OCR Feature"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>

      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <h2>What Users Say</h2>
        <div className="testimonial">
          <p>&quot;DocAssist streamlined my workflow and helped me stay organized like never before</p>
          <span>-Researcher</span>
        </div>
        <div className="testimonial">
          <p>&quot;A simple yet powerful platform that brings together AI and user-friendly tools.&quot;</p>
          <span>- Academic Reviewer</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} DocAssist. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
