from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

class SimpleCourseRecommenderAPI:
    def __init__(self, courses_file="courses.csv"):
        print("Loading course data...")
        self.courses = pd.read_csv(courses_file)
        self.courses['course_id'] = self.courses['course_id'].astype(str)
        print(f"Loaded {len(self.courses)} courses")
        
        self.initialize_system()
    
    def initialize_system(self):
        print("Initializing simple recommendation system...")
        self.create_user_interactions()
        print("Simple recommendation system initialized!")
    
    def create_user_interactions(self):
        num_users = 1000
        print(f"Simulating {num_users} users and their course interactions...")
        
        user_ids = [f"user_{i}" for i in range(num_users)]
        
        np.random.seed(42)
        interactions = []
        
        subjects = self.courses['subject'].unique()
        
        for user_id in user_ids:
            num_preferred_subjects = np.random.randint(1, 3)
            preferred_subjects = np.random.choice(subjects, size=num_preferred_subjects, replace=False)
            
            for subject in preferred_subjects:
                subject_courses = self.courses[self.courses['subject'] == subject]
                if len(subject_courses) > 0:
                    num_courses = min(3, len(subject_courses))
                    selected_courses = subject_courses.sample(n=num_courses)
                    
                    for _, course in selected_courses.iterrows():
                        rating = np.random.uniform(3, 5)
                        interactions.append({
                            'user_id': user_id,
                            'course_id': str(course['course_id']),
                            'rating': rating,
                            'subject': course['subject'],
                            'level': course['level']
                        })
        
        self.ratings = pd.DataFrame(interactions)
        print(f"Generated {len(self.ratings)} user-course interactions")
        self.unique_user_ids = self.ratings['user_id'].unique()
        self.unique_course_ids = self.courses['course_id'].unique()
    
    def recommend_courses_to_user(self, user_id, top_k=5):
        """Simple recommendation based on user's preferred subjects and course popularity"""
        if user_id not in self.unique_user_ids:
            print(f"User {user_id} not found")

            return self.courses.sort_values('num_subscribers', ascending=False).head(top_k)[
                ['course_id', 'course_title', 'subject', 'level', 'price', 'num_subscribers', 'num_reviews', 'num_lectures', 'content_duration']
            ]
        

        user_interactions = self.ratings[self.ratings['user_id'] == user_id]
        if len(user_interactions) == 0:

            return self.courses.sort_values('num_subscribers', ascending=False).head(top_k)[
                ['course_id', 'course_title', 'subject', 'level', 'price', 'num_subscribers', 'num_reviews', 'num_lectures', 'content_duration']
            ]
        

        preferred_subjects = user_interactions['subject'].unique()
        

        recommended_courses = self.courses[
            self.courses['subject'].isin(preferred_subjects)
        ].sort_values('num_subscribers', ascending=False)
        

        if len(recommended_courses) < top_k:
            other_courses = self.courses[
                ~self.courses['subject'].isin(preferred_subjects)
            ].sort_values('num_subscribers', ascending=False)
            
            recommended_courses = pd.concat([recommended_courses, other_courses])
        
        return recommended_courses.head(top_k)[
            ['course_id', 'course_title', 'subject', 'level', 'price', 'num_subscribers', 'num_reviews', 'num_lectures', 'content_duration']
        ]


recommender = SimpleCourseRecommenderAPI()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Simple Course Recommender API is running"})

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    try:
        data = request.get_json()
        user_id = data.get('userId', 'user_0')
        top_k = data.get('topK', 10)
        
        recommendations = recommender.recommend_courses_to_user(user_id, top_k)
        
        if recommendations.empty:
            return jsonify({
                "recommendations": [],
                "message": f"No recommendations found for user {user_id}"
            })
        

        recommendations_list = recommendations.to_dict('records')
        
        return jsonify({
            "recommendations": recommendations_list,
            "userId": user_id,
            "topK": top_k
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/courses', methods=['GET'])
def get_courses():
    try:
        courses_list = recommender.courses.to_dict('records')
        return jsonify({"courses": courses_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    try:
        course = recommender.courses[recommender.courses['course_id'] == course_id]
        if course.empty:
            return jsonify({"error": "Course not found"}), 404
        
        course_dict = course.iloc[0].to_dict()
        return jsonify({"course": course_dict})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/users', methods=['GET'])
def get_users():
    try:
        users = list(recommender.unique_user_ids)
        return jsonify({"users": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Simple Course Recommender API Server...")
    print("API will be available at http://localhost:5000")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /recommend - Get recommendations for a user")
    print("  GET  /courses - Get all courses")
    print("  GET  /courses/<id> - Get specific course")
    print("  GET  /users - Get all users")
    app.run(debug=True, host='0.0.0.0', port=5000) 