"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import styles from "./Testimonials.module.css";

interface Testimonial {
  id: number;
  name: string;
  treatment: string;
  rating: number;
  text: string;
  avatar: string;
  color: string;
  verified: boolean;
}

const testimonials: Testimonial[] = [
  // SEXUAL HEALTH & WELLNESS
  {
    id: 2,
    name: "Rohit Kulkarni",
    treatment: "Sexual Health & Wellness",
    rating: 5,
    text: "My wife and I were facing issues in our relationship but didn't know how to address them. We took couple counseling sessions here, and it really helped us communicate better. The approach was very practical and respectful. Today, our relationship is much stronger.",
    avatar: "RK",
    color: "#0E898F",
    verified: true,
  },
  {
    id: 3,
    name: "Sneha Joshi",
    treatment: "Sexual Health & Wellness",
    rating: 5,
    text: "As a woman, it's not easy to talk about such personal health concerns. But the doctor made me feel very comfortable. The treatment was gentle and effective. I feel much healthier and more confident now.",
    avatar: "SJ",
    color: "#0E898F",
    verified: true,
  },
  // CLINICAL NUTRITION & METABOLIC WELLNESS
  {
    id: 4,
    name: "Priyanka Deshmukh",
    treatment: "Clinical Nutrition & Metabolic Wellness",
    rating: 5,
    text: "I had tried multiple diets before but nothing worked long-term. Here, they gave me a personalized diet plan based on my lifestyle and Indian eating habits. I lost 12 kg in 4 months without feeling weak or starving. The regular follow-ups kept me motivated.",
    avatar: "PD",
    color: "#10B981",
    verified: true,
  },
  {
    id: 5,
    name: "Manoj Shinde",
    treatment: "Clinical Nutrition & Metabolic Wellness",
    rating: 5,
    text: "I was struggling with thyroid and weight gain. The nutrition team explained everything in simple terms and guided me step by step. Now my weight is under control and I feel much more energetic.",
    avatar: "MS",
    color: "#10B981",
    verified: true,
  },
  {
    id: 6,
    name: "Suresh Yadav",
    treatment: "Clinical Nutrition & Metabolic Wellness",
    rating: 5,
    text: "Being diabetic, I had to be very careful with my food. The diet plan I received here helped me manage my sugar levels naturally. It's practical and easy to follow.",
    avatar: "SY",
    color: "#10B981",
    verified: true,
  },
  // BODY SHAPING & CONTOURING
  {
    id: 7,
    name: "Neha Patwardhan",
    treatment: "Body Shaping & Contouring",
    rating: 5,
    text: "After my pregnancy, I had stubborn fat that wouldn't go even with exercise. I opted for body contouring treatment here, and the results are amazing. The procedure was completely non-surgical, and I started seeing changes within a few sessions.",
    avatar: "NP",
    color: "#8B5CF6",
    verified: true,
  },
  {
    id: 8,
    name: "Karan Jadhav",
    treatment: "Body Shaping & Contouring",
    rating: 5,
    text: "I always had fat around my abdomen which was very difficult to reduce. The fat reduction treatment here worked very well. I lost inches without any downtime, and the results look natural.",
    avatar: "KJ",
    color: "#8B5CF6",
    verified: true,
  },
  // FACIAL TRAUMA & MAXILLOFACIAL SURGERY
  {
    id: 9,
    name: "Vikas Pawar",
    treatment: "Facial Trauma & Maxillofacial Surgery",
    rating: 5,
    text: "I met with a serious road accident and had a jaw fracture. I was in a lot of pain and very worried. The doctors here handled my case very professionally. The surgery was successful, and now I can eat and speak normally again. I'm really thankful to the team.",
    avatar: "VP",
    color: "#F59E0B",
    verified: true,
  },
  {
    id: 10,
    name: "Ramesh Gupta",
    treatment: "Facial Trauma & Maxillofacial Surgery",
    rating: 5,
    text: "I had multiple facial injuries after an accident. The emergency response was quick, and the surgeons did an excellent job. My face looks almost the same as before, which I never expected.",
    avatar: "RG",
    color: "#F59E0B",
    verified: true,
  },
  // PREMIUM AESTHETIC & COSMETIC CENTER
  {
    id: 11,
    name: "Ankita More",
    treatment: "Premium Aesthetic & Cosmetic Center",
    rating: 5,
    text: "I took a bridal aesthetic package before my wedding. The team planned everything—skin, face treatments, and overall grooming. The results were glowing but very natural. I received so many compliments on my wedding day.",
    avatar: "AM",
    color: "#EC4899",
    verified: true,
  },
  {
    id: 12,
    name: "Ritu Sharma",
    treatment: "Premium Aesthetic & Cosmetic Center",
    rating: 5,
    text: "I opted for a non-surgical facelift, and the results are subtle yet noticeable. I look fresher and younger without any drastic change. Very satisfied with the outcome.",
    avatar: "RS",
    color: "#EC4899",
    verified: true,
  },
  // HNF ONCOLOGY
  {
    id: 13,
    name: "Ganesh Patil",
    treatment: "HNF Oncology",
    rating: 5,
    text: "During a routine check-up, early signs of oral cancer were detected here. Because of early diagnosis, my treatment started on time. The doctors guided me at every step and supported me emotionally as well. I'm grateful for their care.",
    avatar: "GP",
    color: "#6366F1",
    verified: true,
  },
  {
    id: 14,
    name: "Sunita Verma",
    treatment: "HNF Oncology",
    rating: 5,
    text: "Cancer treatment is not just physical but emotional as well. The team here supported me throughout—from diagnosis to recovery. I never felt alone during my journey.",
    avatar: "SV",
    color: "#6366F1",
    verified: true,
  },
  // HAIR & TRICHOLOGY SCIENCES
  {
    id: 15,
    name: "Akshay Kulkarni",
    treatment: "Hair & Trichology Sciences",
    rating: 5,
    text: "I was facing severe hair fall and tried many products without results. After PRP treatment here, my hair fall reduced significantly, and I can see new growth. Very happy with the improvement.",
    avatar: "AK",
    color: "#14B8A6",
    verified: true,
  },
  {
    id: 16,
    name: "Imran Shaikh",
    treatment: "Hair & Trichology Sciences",
    rating: 5,
    text: "I underwent a hair transplant here, and the results are very natural. The entire process was smooth, and the doctors explained everything clearly.",
    avatar: "IS",
    color: "#14B8A6",
    verified: true,
  },
  // SKIN, DERMATOLOGY & AESTHETIC MEDICINE
  {
    id: 17,
    name: "Pooja Patil",
    treatment: "Skin, Dermatology & Aesthetic Medicine",
    rating: 5,
    text: "I had acne and scars for many years, which affected my confidence. After proper diagnosis and treatment here, my skin has improved a lot. The results are visible and long-lasting.",
    avatar: "PP",
    color: "#0EA5E9",
    verified: true,
  },
  {
    id: 18,
    name: "Farhan Khan",
    treatment: "Skin, Dermatology & Aesthetic Medicine",
    rating: 5,
    text: "I took laser treatment for pigmentation, and the results are excellent. My skin tone is now even and brighter.",
    avatar: "FK",
    color: "#0EA5E9",
    verified: true,
  },
  // GENERAL & ADVANCED DENTISTRY
  {
    id: 19,
    name: "Sanjay More",
    treatment: "General & Advanced Dentistry",
    rating: 5,
    text: "I was very scared of dental treatments, especially root canal. But here, it was completely painless and done in a single sitting. The experience was very smooth.",
    avatar: "SM",
    color: "#F97316",
    verified: true,
  },
  {
    id: 20,
    name: "Deepak Sharma",
    treatment: "General & Advanced Dentistry",
    rating: 5,
    text: "The doctor explained my dental problem in detail and suggested the best treatment. Everything was transparent, and the clinic is very clean and modern.",
    avatar: "DS",
    color: "#F97316",
    verified: true,
  },
  {
    id: 21,
    name: "Ravi Jadhav",
    treatment: "General & Advanced Dentistry",
    rating: 5,
    text: "I got fillings and cleaning done, and the entire process was comfortable. Staff is very polite and professional.",
    avatar: "RJ",
    color: "#F97316",
    verified: true,
  },
  // IMPLANTS & FULL MOUTH REHABILITATION
  {
    id: 22,
    name: "Rajesh Gupta",
    treatment: "Implants & Full Mouth Rehabilitation",
    rating: 5,
    text: "I had missing teeth for years and was not able to eat properly. After getting dental implants here, my chewing and confidence have improved a lot. It feels like natural teeth.",
    avatar: "RG",
    color: "#84CC16",
    verified: true,
  },
  {
    id: 23,
    name: "Mahesh Patil",
    treatment: "Implants & Full Mouth Rehabilitation",
    rating: 5,
    text: "I went for full mouth rehabilitation, and the transformation is amazing. My smile and overall appearance have improved completely.",
    avatar: "MP",
    color: "#84CC16",
    verified: true,
  },
  // COSMETIC DENTISTRY
  {
    id: 24,
    name: "Nikita Sharma",
    treatment: "Cosmetic Dentistry",
    rating: 5,
    text: "I got teeth whitening and veneers done, and my smile looks completely different now. The results are very natural and not artificial.",
    avatar: "NS",
    color: "#E11D48",
    verified: true,
  },
  {
    id: 25,
    name: "Kunal Verma",
    treatment: "Cosmetic Dentistry",
    rating: 5,
    text: "Smile designing was done with proper planning and precision. I am very happy with the final outcome.",
    avatar: "KV",
    color: "#E11D48",
    verified: true,
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? styles.starFilled : styles.starEmpty}
        fill={i < rating ? "#F59E0B" : "none"}
      />
    ));
  };

  const GoogleLogo = () => (
    <div className={styles.googleLogo}>
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>Google</span>
    </div>
  );

  return (
    <section className={styles.testimonials} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.mainCard}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <Star size={14} fill="currentColor" />
              <span>Patient Testimonials</span>
            </div>

            <h2 className={styles.title}>
              What Our <span className={styles.titleAccent}>Valued Patients</span> Say About Us
            </h2>

            <p className={styles.subtitle}>
              Real experiences from our valued patients who trust us for exceptional healthcare and life-changing treatments
            </p>
          </div>

          {/* Carousel */}
          <div className={styles.carouselWrapper}>
            {/* Fade Gradients */}
            <div className={styles.fadeLeft} />
            <div className={styles.fadeRight} />

            {/* Navigation Arrows */}
            <button
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next testimonials"
            >
              <ChevronRight size={20} />
            </button>

            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              centeredSlides={true}
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              speed={800}
              breakpoints={{
                480: {
                  slidesPerView: 1.2,
                  spaceBetween: 16,
                },
                640: {
                  slidesPerView: 1.4,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 1.8,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 2.2,
                  spaceBetween: 28,
                },
                1280: {
                  slidesPerView: 2.5,
                  spaceBetween: 32,
                },
              }}
              onSwiper={(swiper: SwiperType) => {
                swiperRef.current = swiper;
              }}
              className={styles.swiper}
            >
              {testimonials.map((testimonial) => (
                <SwiperSlide key={testimonial.id}>
                  <div className={styles.testimonialCard}>
                    {/* Quote Icon */}
                    <div className={styles.quoteIcon}>
                      <Quote size={24} />
                    </div>

                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarWrapper}>
                        <div
                          className={styles.authorAvatar}
                          style={{
                            background: `linear-gradient(135deg, ${testimonial.color}, ${testimonial.color}dd)`,
                          }}
                        >
                          {testimonial.avatar}
                        </div>
                        {testimonial.verified && (
                          <div className={styles.verifiedBadge}>
                            <Check size={8} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className={styles.authorInfo}>
                        <div className={styles.authorTop}>
                          <h4 className={styles.authorName}>{testimonial.name}</h4>
                          <div className={styles.stars}>{renderStars(testimonial.rating)}</div>
                        </div>
                        <p className={styles.authorTreatment}>{testimonial.treatment}</p>
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className={styles.testimonialText}>
                      <span className={styles.quoteStart}>&ldquo;</span>
                      <span className={styles.textContent}>{testimonial.text}</span>
                      <span className={styles.quoteEnd}>&rdquo;</span>
                      <div className={styles.textFade} />
                    </blockquote>

                    {/* Card Footer */}
                    <div className={styles.cardFooter}>
                      <GoogleLogo />
                      <div className={styles.verifiedReview}>
                        <Check size={12} strokeWidth={3} />
                        <span>Verified Patient</span>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
