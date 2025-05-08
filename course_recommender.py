import pandas as pd
import numpy as np
import tensorflow as tf
import os
import time
from sklearn.metrics.pairwise import cosine_similarity
from colorama import Fore, Style, init

init(autoreset=True)

class CourseRecommender:
    def __init__(self, courses_file="courses.csv"):
        self.print_header("Course Recommender System")
        print(f"{Fore.CYAN}Loading course data from {courses_file}...{Style.RESET_ALL}")
        
        self.courses = pd.read_csv(courses_file)
        self.courses['course_id'] = self.courses['course_id'].astype(str)
        
        print(f"{Fore.GREEN}✓ Loaded {len(self.courses)} courses{Style.RESET_ALL}")
        
        self.initialize_system()
    
    def print_header(self, text):
        terminal_width = os.get_terminal_size().columns
        print("\n" + "=" * terminal_width)
        print(f"{Fore.YELLOW}{text.center(terminal_width)}{Style.RESET_ALL}")
        print("=" * terminal_width + "\n")
    
    def initialize_system(self):
        print(f"{Fore.CYAN}Initializing recommendation system...{Style.RESET_ALL}")
        
        self.create_user_interactions()
        
        self.build_and_train_model()
        
        self.generate_embeddings()
        
        print(f"{Fore.GREEN}✓ Recommendation system initialized and ready!{Style.RESET_ALL}\n")
    
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
        print(f"{Fore.GREEN}✓ Generated {len(self.ratings)} user-course interactions{Style.RESET_ALL}")
        self.unique_user_ids = self.ratings['user_id'].unique()
        self.unique_course_ids = self.courses['course_id'].unique()
    
    def build_and_train_model(self):
        """Build and train the recommendation model."""
        print("Building and training the recommendation model...")
        
        embedding_dimension = 32
        self.user_ids_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.user_ids_vocabulary.adapt(tf.data.Dataset.from_tensor_slices(self.unique_user_ids))
        self.course_ids_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.course_ids_vocabulary.adapt(tf.data.Dataset.from_tensor_slices(self.ratings['course_id'].unique()))
        self.user_model = tf.keras.Sequential([
            self.user_ids_vocabulary,
            tf.keras.layers.Embedding(self.user_ids_vocabulary.vocabulary_size(), embedding_dimension)
        ])
        self.course_model = tf.keras.Sequential([
            self.course_ids_vocabulary,
            tf.keras.layers.Embedding(self.course_ids_vocabulary.vocabulary_size(), embedding_dimension)
        ])
        class RecommenderModel(tf.keras.Model):
            def __init__(self, user_model, course_model):
                super().__init__()
                self.user_model = user_model
                self.course_model = course_model
                self.rating_model = tf.keras.Sequential([
                    tf.keras.layers.Dense(8, activation="relu"),
                    tf.keras.layers.Dense(1)
                ])
                
            def call(self, inputs):
                user_id, course_id = inputs
                user_embedding = self.user_model(user_id)
                course_embedding = self.course_model(course_id)
                concatenated = tf.concat([user_embedding, course_embedding], axis=1)
                return self.rating_model(concatenated)
        self.model = RecommenderModel(self.user_model, self.course_model)
        self.model.compile(
            loss=tf.keras.losses.MeanSquaredError(),
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001)
        )
        def make_dataset(ratings_data, batch_size=256, shuffle=True):
            user_ids_tensor = tf.convert_to_tensor(ratings_data['user_id'].values)
            course_ids_tensor = tf.convert_to_tensor(ratings_data['course_id'].values)
            ratings_tensor = tf.convert_to_tensor(ratings_data['rating'].values, dtype=tf.float32)
            dataset = tf.data.Dataset.from_tensor_slices((
                (user_ids_tensor, course_ids_tensor),
                ratings_tensor
            ))
            if shuffle:
                dataset = dataset.shuffle(buffer_size=len(ratings_data))
            
            dataset = dataset.batch(batch_size)
            return dataset
        
        train_dataset = make_dataset(self.ratings)
        self.model.fit(train_dataset, epochs=5, verbose=0)
        print(f"{Fore.GREEN}✓ Model training complete{Style.RESET_ALL}")
    
    def generate_embeddings(self):
        """Generate embeddings for all users and courses."""
        print("Generating embeddings...")
        
        self.user_embeddings = {}
        for user_id in self.unique_user_ids:
            user_embedding = self.user_model(tf.constant([user_id])).numpy()[0]
            self.user_embeddings[user_id] = user_embedding
        self.course_embeddings = {}
        for course_id in self.unique_course_ids:
            if course_id in self.ratings['course_id'].values:
                course_embedding = self.course_model(tf.constant([course_id])).numpy()[0]
                self.course_embeddings[course_id] = course_embedding
        
        print(f"{Fore.GREEN}✓ Generated embeddings for {len(self.user_embeddings)} users and {len(self.course_embeddings)} courses{Style.RESET_ALL}")
    
    def recommend_courses_to_user(self, user_id, top_k=5):
        """Recommend courses to a user based on embedding similarity."""
        if user_id not in self.user_embeddings:
            print(f"User {user_id} not found in embeddings")
            return pd.DataFrame()
        user_embedding = self.user_embeddings[user_id]
        similarities = []
        
        for course_id, course_embedding in self.course_embeddings.items():
            similarity = np.dot(user_embedding, course_embedding)
            similarities.append((course_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_course_ids = [sim[0] for sim in similarities[:top_k]]
        return self.courses[self.courses['course_id'].isin(top_course_ids)][
            ['course_id', 'course_title', 'subject', 'level', 'price']
        ]
    
    def find_similar_courses(self, course_id, top_k=5):
        """Find similar courses based on embedding similarity."""
        if course_id not in self.course_embeddings:
            print(f"Course {course_id} not found in embeddings")
            return self.get_similar_courses_by_metadata(course_id, top_k)
        
        course_embedding = self.course_embeddings[course_id]
        similarities = []
        for other_id, other_embedding in self.course_embeddings.items():
            if other_id != course_id:
                similarity = np.dot(course_embedding, other_embedding)
                similarities.append((other_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_course_ids = [sim[0] for sim in similarities[:top_k]]
        
        return self.courses[self.courses['course_id'].isin(top_course_ids)][
            ['course_id', 'course_title', 'subject', 'level', 'price']
        ]
    
    def get_similar_courses_by_metadata(self, course_id, num_recommendations=5):
        """Get similar courses based on subject and level."""
        course = self.courses[self.courses['course_id'] == course_id].iloc[0]
        
        similar_courses = self.courses[
            (self.courses['subject'] == course['subject']) & 
            (self.courses['level'] == course['level']) &
            (self.courses['course_id'] != course_id)
        ]
        
        similar_courses = similar_courses.sort_values('num_subscribers', ascending=False)
        
        return similar_courses[['course_id', 'course_title', 'subject', 'level', 'price']].head(num_recommendations)
    
    def display_courses(self, courses_df, title=None, start_idx=0, per_page=10):
        """Display a list of courses with pagination."""
        if title:
            self.print_header(title)
        
        if courses_df.empty:
            print(f"{Fore.RED}No courses found.{Style.RESET_ALL}")
            return start_idx
        
        num_courses = len(courses_df)
        end_idx = min(start_idx + per_page, num_courses)
        
        print(f"{Fore.CYAN}Showing courses {start_idx+1}-{end_idx} of {num_courses}{Style.RESET_ALL}")
        
        for idx, (_, course) in enumerate(courses_df.iloc[start_idx:end_idx].iterrows(), start=start_idx+1):
            print(f"\n{Fore.YELLOW}[{idx}] {Fore.GREEN}{course['course_title']}{Style.RESET_ALL}")
            print(f"   Subject: {course['subject']} | Level: {course['level']} | Price: ${course['price']}")
            print(f"   ID: {course['course_id']}")
        
        print("\n" + "-" * os.get_terminal_size().columns)
        controls = []
        if start_idx > 0:
            controls.append(f"{Fore.BLUE}[P] Previous page{Style.RESET_ALL}")
        if end_idx < num_courses:
            controls.append(f"{Fore.BLUE}[N] Next page{Style.RESET_ALL}")
        
        controls.append(f"{Fore.BLUE}[B] Back to main menu{Style.RESET_ALL}")
        
        print(" | ".join(controls))
        print("-" * os.get_terminal_size().columns)
        
        return end_idx
    
    def run_interactive(self):
        """Run the interactive recommender system."""
        current_user = "user_0"
        
        while True:
            self.print_header("Main Menu")
            
            print(f"{Fore.CYAN}Current User: {current_user}{Style.RESET_ALL}\n")
            print(f"{Fore.YELLOW}[1] Browse All Courses{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}[2] Browse by Subject{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}[3] Course Recommendations for You{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}[4] Change User{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}[5] Exit{Style.RESET_ALL}")
            
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == '1':
                self.browse_all_courses()
            elif choice == '2':
                self.browse_by_subject()
            elif choice == '3':
                self.show_recommendations(current_user)
            elif choice == '4':
                current_user = self.change_user()
            elif choice == '5':
                self.print_header("Thank you for using the Course Recommender!")
                break
            else:
                print(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")
    
    def browse_all_courses(self):
        """Browse all courses with pagination."""
        sorted_courses = self.courses.sort_values('num_subscribers', ascending=False)
        
        start_idx = 0
        per_page = 10
        
        while True:
            end_idx = self.display_courses(sorted_courses, "Browse All Courses", start_idx, per_page)
            
            choice = input("\nEnter a course number to view details, P/N for pagination, or B to go back: ").strip().upper()
            
            if choice == 'B':
                break
            elif choice == 'P' and start_idx > 0:
                start_idx = max(0, start_idx - per_page)
            elif choice == 'N' and end_idx < len(sorted_courses):
                start_idx = end_idx
            elif choice.isdigit() and 1 <= int(choice) <= len(sorted_courses):
                course_idx = int(choice) - 1
                course_id = sorted_courses.iloc[course_idx]['course_id']
                self.view_course_details(course_id)
            else:
                print(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")
    
    def browse_by_subject(self):
        """Browse courses by subject."""
        subjects = sorted(self.courses['subject'].unique())
        
        self.print_header("Browse by Subject")
        
        for idx, subject in enumerate(subjects, start=1):
            print(f"{Fore.YELLOW}[{idx}] {subject}{Style.RESET_ALL}")
        
        print(f"\n{Fore.YELLOW}[B] Back to main menu{Style.RESET_ALL}")
        
        choice = input("\nEnter a subject number or B to go back: ").strip().upper()
        
        if choice == 'B':
            return
        elif choice.isdigit() and 1 <= int(choice) <= len(subjects):
            subject_idx = int(choice) - 1
            selected_subject = subjects[subject_idx]
            
            subject_courses = self.courses[self.courses['subject'] == selected_subject].sort_values('num_subscribers', ascending=False)
            
            start_idx = 0
            per_page = 10
            
            while True:
                end_idx = self.display_courses(subject_courses, f"Courses in {selected_subject}", start_idx, per_page)
                
                subchoice = input("\nEnter a course number to view details, P/N for pagination, or B to go back: ").strip().upper()
                
                if subchoice == 'B':
                    break
                elif subchoice == 'P' and start_idx > 0:
                    start_idx = max(0, start_idx - per_page)
                elif subchoice == 'N' and end_idx < len(subject_courses):
                    start_idx = end_idx
                elif subchoice.isdigit() and 1 <= int(subchoice) <= len(subject_courses):
                    course_idx = int(subchoice) - 1
                    course_id = subject_courses.iloc[course_idx]['course_id']
                    self.view_course_details(course_id)
                else:
                    print(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")
    
    def show_recommendations(self, user_id):
        """Show course recommendations for a user."""
        recommendations = self.recommend_courses_to_user(user_id, top_k=10)
        
        start_idx = 0
        per_page = 10
        
        while True:
            end_idx = self.display_courses(recommendations, f"Recommended Courses for You", start_idx, per_page)
            
            choice = input("\nEnter a course number to view details, P/N for pagination, or B to go back: ").strip().upper()
            
            if choice == 'B':
                break
            elif choice == 'P' and start_idx > 0:
                start_idx = max(0, start_idx - per_page)
            elif choice == 'N' and end_idx < len(recommendations):
                start_idx = end_idx
            elif choice.isdigit() and 1 <= int(choice) <= len(recommendations):
                course_idx = int(choice) - 1
                course_id = recommendations.iloc[course_idx]['course_id']
                self.view_course_details(course_id)
            else:
                print(f"{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")
    
    def view_course_details(self, course_id):
        """View details of a specific course."""
        course = self.courses[self.courses['course_id'] == course_id].iloc[0]
        
        self.print_header(f"Course Details: {course['course_title']}")
        
        print(f"{Fore.CYAN}Subject:{Style.RESET_ALL} {course['subject']}")
        print(f"{Fore.CYAN}Level:{Style.RESET_ALL} {course['level']}")
        print(f"{Fore.CYAN}Price:{Style.RESET_ALL} ${course['price']}")
        print(f"{Fore.CYAN}Subscribers:{Style.RESET_ALL} {course['num_subscribers']}")
        
        if 'description' in course:
            print(f"\n{Fore.CYAN}Description:{Style.RESET_ALL}\n{course['description']}")
        
        print(f"\n{Fore.YELLOW}Similar Courses:{Style.RESET_ALL}")
        similar_courses = self.find_similar_courses(course_id, top_k=5)
        
        if similar_courses.empty:
            print("No similar courses found.")
        else:
            for idx, (_, similar) in enumerate(similar_courses.iterrows(), start=1):
                print(f"\n{idx}. {Fore.GREEN}{similar['course_title']}{Style.RESET_ALL}")
                print(f"   Subject: {similar['subject']} | Level: {similar['level']} | Price: ${similar['price']}")
        
        print("\n" + "-" * os.get_terminal_size().columns)
        print(f"{Fore.BLUE}[V] View a similar course | [B] Back to previous menu{Style.RESET_ALL}")
        print("-" * os.get_terminal_size().columns)
        
        choice = input("\nEnter your choice: ").strip().upper()
        
        if choice == 'V':
            sim_choice = input("Enter the number of the similar course to view: ").strip()
            if sim_choice.isdigit() and 1 <= int(sim_choice) <= len(similar_courses):
                sim_idx = int(sim_choice) - 1
                sim_course_id = similar_courses.iloc[sim_idx]['course_id']
                self.view_course_details(sim_course_id)
            else:
                print(f"{Fore.RED}Invalid choice.{Style.RESET_ALL}")
                time.sleep(1)
        elif choice == 'B':
            return
        else:
            print(f"{Fore.RED}Invalid choice.{Style.RESET_ALL}")
            time.sleep(1)
    
    def change_user(self):
        """Change the current user."""
        self.print_header("Change User")
        
        print("Enter a user ID or leave blank to use a random user.")
        print(f"Format: user_X where X is a number between 0 and {len(self.unique_user_ids)-1}")
        
        user_input = input("\nUser ID: ").strip()
        
        if user_input == "":
            user_id = np.random.choice(self.unique_user_ids)
            print(f"{Fore.GREEN}Selected random user: {user_id}{Style.RESET_ALL}")
            return user_id
        elif user_input in self.unique_user_ids:
            print(f"{Fore.GREEN}User changed to: {user_input}{Style.RESET_ALL}")
            return user_input
        else:
            print(f"{Fore.RED}Invalid user ID. Using default user_0.{Style.RESET_ALL}")
            return "user_0"


if __name__ == "__main__":
    recommender = CourseRecommender()
    recommender.run_interactive()