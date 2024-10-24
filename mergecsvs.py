# import os
# import pandas as pd
#
# # Define the root directory where all folders are located
# root_directory = "./scrapeddata/"  # Change this to your directory
#
# # List to store dataframes
# df_list = []
#
# # Walk through the directory and find 'BC Assessment Information.csv'
# for subdir, dirs, files in os.walk(root_directory):
#     for file in files:
#         if file == 'BC Assessment Information.csv':
#             file_path = os.path.join(subdir, file)
#             # Read the CSV file and append to the list
#             df = pd.read_csv(file_path)
#             df_list.append(df)
#
# # Concatenate all dataframes into one
# combined_df = pd.concat(df_list, ignore_index=True)
#
# # Save the combined dataframe to a new CSV file
# output_file = os.path.join(root_directory, 'AssessmentInformation.csv')
# combined_df.to_csv(output_file, index=False)
#
# print(f"All files have been merged and saved as {output_file}")

import os
import pandas as pd

# Define the root directory where all folders are located
root_directory = "./scrapeddata/"  # Change this to your directory

# List to store merged dataframes from each folder
df_list = []

# Walk through the directory and find 'BC Assessment Information.csv' and 'Properties.csv'
for subdir, dirs, files in os.walk(root_directory):
    # Check if both CSVs exist in the current folder
    assessment_file = os.path.join(subdir, 'BC Assessment Information.csv')
    properties_file = os.path.join(subdir, 'Properties.csv')

    if os.path.exists(assessment_file) and os.path.exists(properties_file):
        # Read both CSV files
        assessment_df = pd.read_csv(assessment_file)
        properties_df = pd.read_csv(properties_file)

        # Merge the two DataFrames. Assuming they have a common column like 'PropertyID' or similar.
        # If there's a specific common key to merge on, replace 'common_column' with that column name.
        # 'how="inner"' ensures only matching records are merged.
        merged_df = pd.merge(assessment_df, properties_df, how='inner')

        # Append the merged DataFrame to the list
        df_list.append(merged_df)

# Concatenate all the merged DataFrames into one
if df_list:
    combined_df = pd.concat(df_list, ignore_index=True)

    # Handle duplicate columns (if any) after the merge
    # If two columns have the same name, pandas will add suffixes (like '_x', '_y') to the column names.
    # Here, we'll drop the duplicate columns with the '_y' suffix (or rename them).
    combined_df = combined_df.loc[:, ~combined_df.columns.duplicated()]

    # Save the combined dataframe to a new CSV file
    output_file = os.path.join(root_directory, 'AssessmentInformation.csv')
    combined_df.to_csv(output_file, index=False)

    print(f"All files have been merged and saved as {output_file}")
else:
    print("No files were found for merging.")

